import os
import secrets
from flask import Blueprint, request, jsonify, send_file, current_app, session
from flask_login import current_user
from redis import Redis
from app.models import Gallery, Image
from app.services.zip_generator import create_zip_task
from app.services.audit_logger import log_action

bp = Blueprint('downloads', __name__, url_prefix='/api')


@bp.route('/galleries/<slug>/download', methods=['POST'])
def request_zip_download(slug):
    gallery = Gallery.query.filter_by(slug=slug).first()
    if not gallery:
        return jsonify({'error': 'Gallery not found'}), 404

    if not gallery.is_public and not session.get(f'gallery_auth:{gallery.id}'):
        if not current_user.is_authenticated:
            return jsonify({'error': 'Authentication required'}), 401

    if not gallery.allow_download and not current_user.is_authenticated:
        return jsonify({'error': 'Downloads not allowed for this gallery'}), 403

    images = gallery.images.order_by(Image.order).all()
    if not images:
        return jsonify({'error': 'No images in gallery'}), 404

    task_id = secrets.token_urlsafe(16)

    redis_client = Redis.from_url(current_app.config['REDIS_URL'])
    redis_client.setex(f'zip_task:{task_id}', 3600, 'pending')

    create_zip_task(gallery, images, task_id, current_app.config['REDIS_URL'])

    if current_user.is_authenticated:
        log_action(
            admin_id=current_user.id,
            action='download_request',
            resource_type='gallery',
            resource_id=gallery.id,
            details={'task_id': task_id, 'image_count': len(images)},
            ip_address=request.remote_addr
        )

    return jsonify({
        'task_id': task_id,
        'status': 'pending',
        'message': 'ZIP creation started'
    }), 202


@bp.route('/downloads/<task_id>/status', methods=['GET'])
def get_zip_status(task_id):
    redis_client = Redis.from_url(current_app.config['REDIS_URL'])
    status = redis_client.get(f'zip_task:{task_id}')

    if not status:
        return jsonify({'error': 'Task not found'}), 404

    status_str = status.decode('utf-8')

    if status_str.startswith('ready:'):
        filename = status_str.split(':', 1)[1]
        return jsonify({
            'status': 'ready',
            'filename': filename
        }), 200
    elif status_str.startswith('error:'):
        error_msg = status_str.split(':', 1)[1]
        return jsonify({
            'status': 'error',
            'error': error_msg
        }), 500
    else:
        return jsonify({
            'status': status_str
        }), 200


@bp.route('/downloads/<task_id>/file', methods=['GET'])
def download_zip_file(task_id):
    redis_client = Redis.from_url(current_app.config['REDIS_URL'])
    status = redis_client.get(f'zip_task:{task_id}')

    if not status:
        return jsonify({'error': 'Task not found'}), 404

    status_str = status.decode('utf-8')

    if not status_str.startswith('ready:'):
        return jsonify({'error': 'ZIP file not ready'}), 400

    filename = status_str.split(':', 1)[1]
    zip_path = os.path.join(current_app.config['ZIP_OUTPUT_PATH'], filename)

    if not os.path.exists(zip_path):
        return jsonify({'error': 'ZIP file not found'}), 404

    return send_file(zip_path, mimetype='application/zip', as_attachment=True, download_name=filename)
