import os
import shutil
from flask import Blueprint, request, jsonify, session
from flask_login import current_user
from app import bcrypt, cache
from app.models import db, Gallery, Image
from app.utils.decorators import admin_required, audit_log
from app.utils.helpers import slugify
from flask import current_app

bp = Blueprint('galleries', __name__)


@bp.route('/api/galleries', methods=['GET'])
def list_public_galleries():
    galleries = Gallery.query.filter_by(is_public=True).order_by(Gallery.created_at.desc()).all()

    return jsonify([{
        'id': g.id,
        'name': g.name,
        'slug': g.slug,
        'image_count': g.image_count,
        'hover_animation': g.hover_animation,
        'cover_image_id': g.cover_image_id,
        'created_at': g.created_at.isoformat()
    } for g in galleries]), 200


@bp.route('/api/galleries/<slug>', methods=['GET'])
def get_gallery_by_slug(slug):
    gallery = Gallery.query.filter_by(slug=slug).first()
    if not gallery:
        return jsonify({'error': 'Gallery not found'}), 404

    if not gallery.is_public and not session.get(f'gallery_auth:{gallery.id}'):
        return jsonify({'error': 'Authentication required', 'requires_password': True}), 401

    images = gallery.images.filter_by(is_hidden=False).order_by(Image.order).all()

    return jsonify({
        'id': gallery.id,
        'name': gallery.name,
        'slug': gallery.slug,
        'is_public': gallery.is_public,
        'allow_download': gallery.allow_download,
        'thumbnail_only': gallery.thumbnail_only,
        'image_count': len(images),
        'images': [{
            'id': img.id,
            'filename': img.filename,
            'original_filename': img.original_filename,
            'width': img.width,
            'height': img.height,
            'order': img.order
        } for img in images]
    }), 200


@bp.route('/api/galleries/<slug>/authenticate', methods=['POST'])
def authenticate_gallery(slug):
    gallery = Gallery.query.filter_by(slug=slug).first()
    if not gallery:
        return jsonify({'error': 'Gallery not found'}), 404

    if gallery.is_public or not gallery.password_hash:
        return jsonify({'error': 'Gallery does not require password'}), 400

    data = request.get_json()
    password = data.get('password')

    if not password or not bcrypt.check_password_hash(gallery.password_hash, password):
        return jsonify({'error': 'Invalid password'}), 401

    session[f'gallery_auth:{gallery.id}'] = True
    session.permanent = True

    return jsonify({'message': 'Authentication successful'}), 200


@bp.route('/api/admin/galleries', methods=['GET'])
@admin_required
def list_all_galleries():
    galleries = Gallery.query.order_by(Gallery.created_at.desc()).all()

    return jsonify([{
        'id': g.id,
        'name': g.name,
        'slug': g.slug,
        'is_public': g.is_public,
        'hover_animation': g.hover_animation,
        'cover_image_id': g.cover_image_id,
        'image_count': g.image_count,
        'owner_id': g.owner_id,
        'created_at': g.created_at.isoformat(),
        'updated_at': g.updated_at.isoformat()
    } for g in galleries]), 200


@bp.route('/api/admin/galleries', methods=['POST'])
@admin_required
@audit_log('create', 'gallery')
def create_gallery():
    data = request.get_json()
    name = data.get('name')

    if not name:
        return jsonify({'error': 'Name is required'}), 400

    slug = slugify(name)
    if Gallery.query.filter_by(slug=slug).first():
        return jsonify({'error': 'Gallery with this name already exists'}), 409

    gallery = Gallery(
        name=name,
        slug=slug,
        is_public=data.get('is_public', True),
        allow_download=data.get('allow_download', True),
        thumbnail_only=data.get('thumbnail_only', False),
        watermark_enabled=data.get('watermark_enabled', False),
        watermark_opacity=data.get('watermark_opacity', 30),
        watermark_text=data.get('watermark_text'),
        thumbnail_quality=data.get('thumbnail_quality', 85),
        hover_animation=data.get('hover_animation', 'crossfade'),
        owner_id=current_user.id
    )

    if data.get('password'):
        gallery.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    db.session.add(gallery)
    db.session.commit()

    gallery_dir = os.path.join(current_app.config['GALLERY_DATA_PATH'], str(gallery.id))
    os.makedirs(os.path.join(gallery_dir, 'originals'), exist_ok=True)
    os.makedirs(os.path.join(gallery_dir, 'thumbnails'), exist_ok=True)

    return jsonify({
        'id': gallery.id,
        'name': gallery.name,
        'slug': gallery.slug,
        'message': 'Gallery created successfully'
    }), 201


@bp.route('/api/admin/galleries/<int:id>', methods=['GET'])
@admin_required
def get_gallery(id):
    gallery = Gallery.query.get_or_404(id)
    images = gallery.images.order_by(Image.order).all()

    return jsonify({
        'id': gallery.id,
        'name': gallery.name,
        'slug': gallery.slug,
        'is_public': gallery.is_public,
        'allow_download': gallery.allow_download,
        'thumbnail_only': gallery.thumbnail_only,
        'watermark_enabled': gallery.watermark_enabled,
        'watermark_opacity': gallery.watermark_opacity,
        'watermark_text': gallery.watermark_text,
        'thumbnail_quality': gallery.thumbnail_quality,
        'hover_animation': gallery.hover_animation,
        'cover_image_id': gallery.cover_image_id,
        'image_count': gallery.image_count,
        'owner_id': gallery.owner_id,
        'created_at': gallery.created_at.isoformat(),
        'updated_at': gallery.updated_at.isoformat(),
        'images': [{
            'id': img.id,
            'filename': img.filename,
            'original_filename': img.original_filename,
            'width': img.width,
            'height': img.height,
            'is_hidden': img.is_hidden,
            'order': img.order
        } for img in images]
    }), 200


@bp.route('/api/admin/galleries/<int:id>', methods=['PUT'])
@admin_required
@audit_log('update', 'gallery')
def update_gallery(id):
    gallery = Gallery.query.get_or_404(id)
    data = request.get_json()

    if 'name' in data:
        gallery.name = data['name']
        gallery.slug = slugify(data['name'])
    if 'is_public' in data:
        gallery.is_public = data['is_public']
    if 'allow_download' in data:
        gallery.allow_download = data['allow_download']
    if 'thumbnail_only' in data:
        gallery.thumbnail_only = data['thumbnail_only']
    if 'watermark_enabled' in data:
        gallery.watermark_enabled = data['watermark_enabled']
    if 'watermark_opacity' in data:
        gallery.watermark_opacity = data['watermark_opacity']
    if 'watermark_text' in data:
        gallery.watermark_text = data['watermark_text'] or None
    if 'thumbnail_quality' in data:
        gallery.thumbnail_quality = data['thumbnail_quality']
    if 'hover_animation' in data:
        gallery.hover_animation = data['hover_animation']
    if 'cover_image_id' in data:
        gallery.cover_image_id = data['cover_image_id']

    if 'password' in data:
        if data['password']:
            gallery.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        else:
            gallery.password_hash = None

    cache.clear()

    db.session.commit()

    return jsonify({'message': 'Gallery updated successfully'}), 200


@bp.route('/api/admin/galleries/<int:id>', methods=['DELETE'])
@admin_required
@audit_log('delete', 'gallery')
def delete_gallery(id):
    gallery = Gallery.query.get_or_404(id)

    gallery_dir = os.path.join(current_app.config['GALLERY_DATA_PATH'], str(gallery.id))
    if os.path.exists(gallery_dir):
        shutil.rmtree(gallery_dir)

    db.session.delete(gallery)
    db.session.commit()

    cache.clear()

    return jsonify({'message': 'Gallery deleted successfully'}), 200
