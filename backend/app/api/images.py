import os
from flask import Blueprint, request, jsonify, send_file, current_app, session
from flask_login import current_user
from werkzeug.utils import secure_filename
from PIL import Image as PILImage
from app import cache
from app.models import db, Gallery, Image
from app.utils.decorators import admin_required, audit_log
from app.utils.helpers import generate_unique_filename, allowed_file
from app.services.image_processor import generate_thumbnail, apply_watermark

bp = Blueprint('images', __name__)


@bp.route('/api/admin/galleries/<int:gallery_id>/images', methods=['POST'])
@admin_required
@audit_log('upload', 'image')
def upload_image(gallery_id):
    gallery = Gallery.query.get_or_404(gallery_id)

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename, current_app.config['ALLOWED_EXTENSIONS']):
        return jsonify({'error': 'Invalid file type'}), 400

    original_filename = secure_filename(file.filename)
    filename = generate_unique_filename(original_filename)

    gallery_dir = os.path.join(current_app.config['GALLERY_DATA_PATH'], str(gallery.id))
    originals_dir = os.path.join(gallery_dir, 'originals')
    os.makedirs(originals_dir, exist_ok=True)

    file_path = os.path.join(originals_dir, filename)
    file.save(file_path)

    with PILImage.open(file_path) as img:
        width, height = img.size

    file_size = os.path.getsize(file_path)

    max_order = db.session.query(db.func.max(Image.order)).filter_by(gallery_id=gallery.id).scalar() or 0

    image = Image(
        gallery_id=gallery.id,
        filename=filename,
        original_filename=original_filename,
        file_size=file_size,
        width=width,
        height=height,
        file_path=file_path,
        order=max_order + 1,
        uploaded_by=current_user.id
    )

    db.session.add(image)
    db.session.commit()

    thumbnails_dir = os.path.join(gallery_dir, 'thumbnails')
    for size in ['small', 'medium', 'large']:
        generate_thumbnail(file_path, thumbnails_dir, size, gallery.thumbnail_quality)

    return jsonify({
        'id': image.id,
        'filename': image.filename,
        'original_filename': image.original_filename,
        'width': image.width,
        'height': image.height,
        'file_size': image.file_size,
        'message': 'Image uploaded successfully'
    }), 201


@bp.route('/images/thumbnails/<int:gallery_id>/<int:image_id>', methods=['GET'])
def serve_thumbnail(gallery_id, image_id):
    size = request.args.get('size', 'medium')
    if size not in ['small', 'medium', 'large']:
        size = 'medium'

    image = Image.query.filter_by(id=image_id, gallery_id=gallery_id).first_or_404()
    gallery = image.gallery

    if not gallery.is_public and not session.get(f'gallery_auth:{gallery.id}'):
        if not current_user.is_authenticated:
            return jsonify({'error': 'Authentication required'}), 401

    thumbnails_dir = os.path.join(current_app.config['GALLERY_DATA_PATH'], str(gallery_id), 'thumbnails')
    thumbnail_path = generate_thumbnail(image.file_path, thumbnails_dir, size, gallery.thumbnail_quality)

    if not os.path.exists(thumbnail_path):
        return jsonify({'error': 'Thumbnail not found'}), 404

    return send_file(thumbnail_path, mimetype='image/jpeg')


@bp.route('/images/full/<int:gallery_id>/<int:image_id>', methods=['GET'])
def serve_full_image(gallery_id, image_id):
    image = Image.query.filter_by(id=image_id, gallery_id=gallery_id).first_or_404()
    gallery = image.gallery

    if not gallery.is_public and not session.get(f'gallery_auth:{gallery.id}'):
        if not current_user.is_authenticated:
            return jsonify({'error': 'Authentication required'}), 401

    if gallery.thumbnail_only and not current_user.is_authenticated:
        return jsonify({'error': 'Full resolution not available'}), 403

    file_path = image.file_path

    if gallery.watermark_enabled and not current_user.is_authenticated:
        watermarked_dir = os.path.join(current_app.config['GALLERY_DATA_PATH'], str(gallery_id), 'watermarked')
        os.makedirs(watermarked_dir, exist_ok=True)
        watermarked_path = os.path.join(watermarked_dir, image.filename)

        if not os.path.exists(watermarked_path):
            apply_watermark(file_path, watermarked_path, gallery.name, gallery.watermark_opacity)

        file_path = watermarked_path

    if not os.path.exists(file_path):
        return jsonify({'error': 'Image not found'}), 404

    return send_file(file_path, mimetype='image/jpeg', as_attachment=False, download_name=image.original_filename)


@bp.route('/api/admin/images/<int:id>', methods=['DELETE'])
@admin_required
@audit_log('delete', 'image')
def delete_image(id):
    image = Image.query.get_or_404(id)
    gallery = image.gallery
    gallery_id = image.gallery_id

    if gallery.cover_image_id == image.id:
        gallery.cover_image_id = None

    if os.path.exists(image.file_path):
        os.remove(image.file_path)

    thumbnails_dir = os.path.join(current_app.config['GALLERY_DATA_PATH'], str(gallery_id), 'thumbnails')
    for size in ['small', 'medium', 'large']:
        name, ext = os.path.splitext(image.filename)
        thumb_path = os.path.join(thumbnails_dir, f"{name}_{size}{ext}")
        if os.path.exists(thumb_path):
            os.remove(thumb_path)

    watermarked_path = os.path.join(current_app.config['GALLERY_DATA_PATH'], str(gallery_id), 'watermarked', image.filename)
    if os.path.exists(watermarked_path):
        os.remove(watermarked_path)

    db.session.delete(image)
    db.session.commit()

    cache.clear()

    return jsonify({'message': 'Image deleted successfully'}), 200


@bp.route('/api/admin/images/<int:id>/visibility', methods=['PUT'])
@admin_required
@audit_log('update_visibility', 'image')
def update_image_visibility(id):
    image = Image.query.get_or_404(id)
    data = request.get_json()

    is_hidden = data.get('is_hidden')
    if is_hidden is None:
        return jsonify({'error': 'is_hidden is required'}), 400

    image.is_hidden = is_hidden
    db.session.commit()

    cache.clear()

    return jsonify({'message': 'Image visibility updated'}), 200


@bp.route('/api/admin/images/<int:id>/order', methods=['PUT'])
@admin_required
@audit_log('reorder', 'image')
def update_image_order(id):
    image = Image.query.get_or_404(id)
    data = request.get_json()

    new_order = data.get('order')
    if new_order is None:
        return jsonify({'error': 'Order is required'}), 400

    image.order = new_order
    db.session.commit()

    return jsonify({'message': 'Image order updated successfully'}), 200
