import os
import tempfile
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file, current_app, session, after_this_request
from flask_login import current_user
from werkzeug.utils import secure_filename
from PIL import Image as PILImage
from app import cache
from app.models import db, Gallery, Image, GalleryAccessLog
from app.utils.decorators import admin_required, audit_log
from app.utils.helpers import generate_unique_filename, allowed_file
from app.services.image_processor import generate_thumbnail, generate_all_thumbnails, apply_watermark

bp = Blueprint('images', __name__)


def _watermark_kwargs(gallery, position_override=None, is_thumbnail=False):
    return dict(
        text=gallery.watermark_text or gallery.name,
        opacity=gallery.watermark_opacity,
        position=position_override or gallery.watermark_position,
        color=gallery.watermark_color,
        font_name=gallery.watermark_font,
        font_size=gallery.watermark_font_size,
        watermark_type=gallery.watermark_type,
        watermark_image_path=gallery.watermark_image_path,
        repeat=gallery.watermark_repeat,
        spacing=gallery.watermark_spacing,
        grid_angle=gallery.watermark_grid_angle,
        quality=gallery.watermark_quality,
        is_thumbnail=is_thumbnail,
    )


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

    gallery_dir = os.path.join(current_app.config['GALLERY_DATA_PATH'], str(gallery.id))
    originals_dir = os.path.join(gallery_dir, 'originals')
    thumbnails_dir = os.path.join(gallery_dir, 'thumbnails')
    os.makedirs(originals_dir, exist_ok=True)

    existing = Image.query.filter_by(gallery_id=gallery.id, original_filename=original_filename).first()

    if existing:
        if os.path.exists(existing.file_path):
            os.remove(existing.file_path)
        for size in ['small', 'medium', 'large']:
            name, ext = os.path.splitext(existing.filename)
            thumb_path = os.path.join(thumbnails_dir, f"{name}_{size}{ext}")
            if os.path.exists(thumb_path):
                os.remove(thumb_path)
        watermarked_path = os.path.join(gallery_dir, 'watermarked', existing.filename)
        if os.path.exists(watermarked_path):
            os.remove(watermarked_path)
        watermarked_thumbs_dir = os.path.join(gallery_dir, 'watermarked_thumbnails')
        for wt_size in ['small', 'medium', 'large']:
            name_wt, ext_wt = os.path.splitext(existing.filename)
            wt_path = os.path.join(watermarked_thumbs_dir, f"{name_wt}_{wt_size}{ext_wt}")
            if os.path.exists(wt_path):
                os.remove(wt_path)

        filename = existing.filename
        file_path = os.path.join(originals_dir, filename)
        file.save(file_path)

        with PILImage.open(file_path) as img:
            width, height = img.size

        existing.file_size = os.path.getsize(file_path)
        existing.width = width
        existing.height = height
        existing.file_path = file_path
        existing.file_modified_at = datetime.utcfromtimestamp(os.path.getmtime(file_path))
        existing.uploaded_at = datetime.utcnow()
        existing.uploaded_by = current_user.id

        db.session.commit()

        generate_all_thumbnails(file_path, thumbnails_dir, gallery.thumbnail_quality)

        return jsonify({
            'id': existing.id,
            'filename': existing.filename,
            'original_filename': existing.original_filename,
            'width': existing.width,
            'height': existing.height,
            'file_size': existing.file_size,
            'message': 'Image replaced successfully'
        }), 200

    filename = generate_unique_filename(original_filename)
    file_path = os.path.join(originals_dir, filename)
    file.save(file_path)

    with PILImage.open(file_path) as img:
        width, height = img.size

    file_size = os.path.getsize(file_path)
    file_mtime = datetime.utcfromtimestamp(os.path.getmtime(file_path))

    max_order = db.session.query(db.func.max(Image.order)).filter_by(gallery_id=gallery.id).scalar() or 0

    image = Image(
        gallery_id=gallery.id,
        filename=filename,
        original_filename=original_filename,
        file_size=file_size,
        width=width,
        height=height,
        file_path=file_path,
        file_modified_at=file_mtime,
        order=max_order + 1,
        uploaded_by=current_user.id
    )

    db.session.add(image)
    db.session.commit()

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

    skip_watermark = request.args.get('raw') == 'true' and current_user.is_authenticated
    if gallery.watermark_enabled and not skip_watermark:
        watermarked_thumbs_dir = os.path.join(
            current_app.config['GALLERY_DATA_PATH'], str(gallery_id), 'watermarked_thumbnails')
        os.makedirs(watermarked_thumbs_dir, exist_ok=True)
        name, ext = os.path.splitext(image.filename)
        watermarked_thumb_path = os.path.join(watermarked_thumbs_dir, f"{name}_{size}{ext}")

        if not os.path.exists(watermarked_thumb_path):
            apply_watermark(
                thumbnail_path, watermarked_thumb_path,
                **_watermark_kwargs(gallery, gallery.watermark_position_thumbnail, is_thumbnail=True)
            )
        thumbnail_path = watermarked_thumb_path

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

    skip_watermark = request.args.get('raw') == 'true' and current_user.is_authenticated
    if gallery.watermark_enabled and not skip_watermark:
        watermarked_dir = os.path.join(current_app.config['GALLERY_DATA_PATH'], str(gallery_id), 'watermarked')
        os.makedirs(watermarked_dir, exist_ok=True)
        watermarked_path = os.path.join(watermarked_dir, image.filename)

        if not os.path.exists(watermarked_path):
            apply_watermark(
                file_path, watermarked_path,
                **_watermark_kwargs(gallery)
            )

        file_path = watermarked_path

    if not os.path.exists(file_path):
        return jsonify({'error': 'Image not found'}), 404

    if gallery.collect_emails and not current_user.is_authenticated:
        visitor_email = request.cookies.get(f'gallery_email_{gallery.id}')
        if visitor_email:
            access_log = GalleryAccessLog(
                gallery_id=gallery.id,
                email=visitor_email,
                action='view_image',
                image_id=image.id,
                ip_address=request.remote_addr
            )
            db.session.add(access_log)
            db.session.commit()

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

    gallery_dir = os.path.join(current_app.config['GALLERY_DATA_PATH'], str(gallery_id))
    watermarked_path = os.path.join(gallery_dir, 'watermarked', image.filename)
    if os.path.exists(watermarked_path):
        os.remove(watermarked_path)

    watermarked_thumbs_dir = os.path.join(gallery_dir, 'watermarked_thumbnails')
    for size in ['small', 'medium', 'large']:
        name, ext = os.path.splitext(image.filename)
        wt_path = os.path.join(watermarked_thumbs_dir, f"{name}_{size}{ext}")
        if os.path.exists(wt_path):
            os.remove(wt_path)

    db.session.delete(image)
    db.session.commit()

    cache.clear()

    return jsonify({'message': 'Image deleted successfully'}), 200


@bp.route('/api/admin/galleries/<int:gallery_id>/images', methods=['DELETE'])
@admin_required
@audit_log('delete_all', 'image')
def delete_all_images(gallery_id):
    gallery = Gallery.query.get_or_404(gallery_id)
    images = Image.query.filter_by(gallery_id=gallery_id).all()

    gallery_dir = os.path.join(current_app.config['GALLERY_DATA_PATH'], str(gallery_id))
    for subdir in ['originals', 'thumbnails', 'watermarked', 'watermarked_thumbnails']:
        dir_path = os.path.join(gallery_dir, subdir)
        if os.path.exists(dir_path):
            for f in os.listdir(dir_path):
                os.remove(os.path.join(dir_path, f))

    gallery.cover_image_id = None
    for image in images:
        db.session.delete(image)

    db.session.commit()
    cache.clear()

    return jsonify({'message': f'Deleted {len(images)} images'}), 200


@bp.route('/api/admin/galleries/<int:gallery_id>/regenerate-thumbnail/<int:image_id>', methods=['POST'])
@admin_required
def regenerate_thumbnail(gallery_id, image_id):
    gallery = Gallery.query.get_or_404(gallery_id)
    image = Image.query.filter_by(id=image_id, gallery_id=gallery_id).first_or_404()

    gallery_dir = os.path.join(current_app.config['GALLERY_DATA_PATH'], str(gallery_id))
    thumbnails_dir = os.path.join(gallery_dir, 'thumbnails')

    for size in ['small', 'medium', 'large']:
        name, ext = os.path.splitext(image.filename)
        thumb_path = os.path.join(thumbnails_dir, f"{name}_{size}{ext}")
        if os.path.exists(thumb_path):
            os.remove(thumb_path)

    if not os.path.exists(image.file_path):
        return jsonify({'error': 'Original file missing'}), 404

    generate_all_thumbnails(image.file_path, thumbnails_dir, gallery.thumbnail_quality)
    return jsonify({'message': 'ok'}), 200


@bp.route('/api/admin/galleries/<int:gallery_id>/regenerate-watermark/<int:image_id>', methods=['POST'])
@admin_required
def regenerate_watermark(gallery_id, image_id):
    gallery = Gallery.query.get_or_404(gallery_id)
    image = Image.query.filter_by(id=image_id, gallery_id=gallery_id).first_or_404()

    if not os.path.exists(image.file_path):
        return jsonify({'error': 'Original file missing'}), 404

    gallery_dir = os.path.join(current_app.config['GALLERY_DATA_PATH'], str(gallery_id))

    watermarked_dir = os.path.join(gallery_dir, 'watermarked')
    os.makedirs(watermarked_dir, exist_ok=True)
    watermarked_path = os.path.join(watermarked_dir, image.filename)
    if os.path.exists(watermarked_path):
        os.remove(watermarked_path)
    apply_watermark(image.file_path, watermarked_path, **_watermark_kwargs(gallery))

    watermarked_thumbs_dir = os.path.join(gallery_dir, 'watermarked_thumbnails')
    os.makedirs(watermarked_thumbs_dir, exist_ok=True)
    thumbnails_dir = os.path.join(gallery_dir, 'thumbnails')
    for size in ['small', 'medium', 'large']:
        name, ext = os.path.splitext(image.filename)
        wt_path = os.path.join(watermarked_thumbs_dir, f"{name}_{size}{ext}")
        if os.path.exists(wt_path):
            os.remove(wt_path)
        thumb_path = os.path.join(thumbnails_dir, f"{name}_{size}{ext}")
        if os.path.exists(thumb_path):
            apply_watermark(
                thumb_path, wt_path,
                **_watermark_kwargs(gallery, gallery.watermark_position_thumbnail, is_thumbnail=True)
            )

    return jsonify({'message': 'ok'}), 200


ALLOWED_WATERMARK_EXTENSIONS = {'png', 'jpg', 'jpeg', 'svg'}


@bp.route('/api/admin/galleries/<int:gallery_id>/watermark-image', methods=['POST'])
@admin_required
def upload_watermark_image(gallery_id):
    gallery = Gallery.query.get_or_404(gallery_id)

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400

    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_WATERMARK_EXTENSIONS:
        return jsonify({'error': 'Invalid file type. Use PNG, JPEG, or SVG'}), 400

    gallery_dir = os.path.join(current_app.config['GALLERY_DATA_PATH'], str(gallery_id))
    os.makedirs(gallery_dir, exist_ok=True)

    if gallery.watermark_image_path and os.path.exists(gallery.watermark_image_path):
        os.remove(gallery.watermark_image_path)

    filename = f"watermark.{ext}"
    file_path = os.path.join(gallery_dir, filename)
    file.save(file_path)

    gallery.watermark_image_path = file_path
    gallery.watermark_type = 'image'
    db.session.commit()

    return jsonify({'message': 'Watermark image uploaded', 'watermark_type': 'image'}), 200


@bp.route('/api/admin/galleries/<int:gallery_id>/watermark-image', methods=['DELETE'])
@admin_required
def delete_watermark_image(gallery_id):
    gallery = Gallery.query.get_or_404(gallery_id)

    if gallery.watermark_image_path and os.path.exists(gallery.watermark_image_path):
        os.remove(gallery.watermark_image_path)

    gallery.watermark_image_path = None
    gallery.watermark_type = 'text'
    db.session.commit()

    return jsonify({'message': 'Watermark image removed', 'watermark_type': 'text'}), 200


@bp.route('/api/admin/galleries/<int:gallery_id>/watermark-preview/<int:image_id>', methods=['GET'])
@admin_required
def watermark_preview(gallery_id, image_id):
    gallery = Gallery.query.get_or_404(gallery_id)
    image = Image.query.filter_by(id=image_id, gallery_id=gallery_id).first_or_404()

    if not os.path.exists(image.file_path):
        return jsonify({'error': 'Original file missing'}), 404

    thumbnails_dir = os.path.join(current_app.config['GALLERY_DATA_PATH'], str(gallery_id), 'thumbnails')
    thumb_path = generate_thumbnail(image.file_path, thumbnails_dir, 'large', gallery.thumbnail_quality)

    kwargs = dict(
        text=request.args.get('text') or gallery.watermark_text or gallery.name,
        opacity=request.args.get('opacity', gallery.watermark_opacity, type=int),
        position=request.args.get('position') or gallery.watermark_position,
        color=request.args.get('color') or gallery.watermark_color,
        font_name=request.args.get('font') or gallery.watermark_font,
        font_size=request.args.get('font_size', gallery.watermark_font_size, type=int),
        watermark_type=request.args.get('type') or gallery.watermark_type,
        watermark_image_path=gallery.watermark_image_path,
        repeat=request.args.get('repeat') or gallery.watermark_repeat,
        spacing=request.args.get('spacing', gallery.watermark_spacing, type=int),
        grid_angle=request.args.get('grid_angle', gallery.watermark_grid_angle, type=int),
        quality=request.args.get('quality', gallery.watermark_quality, type=int),
    )

    fd, preview_path = tempfile.mkstemp(suffix='.jpg')
    os.close(fd)

    apply_watermark(thumb_path, preview_path, **kwargs)

    @after_this_request
    def cleanup(response):
        try:
            os.unlink(preview_path)
        except OSError:
            pass
        return response

    return send_file(preview_path, mimetype='image/jpeg')


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
