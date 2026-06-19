import os
from flask import Blueprint, request, jsonify, send_file, current_app
from PIL import Image as PILImage
from app.models import db, SiteSettings
from app.utils.decorators import admin_required

bp = Blueprint('site_settings', __name__, url_prefix='/api')

SETTINGS_KEYS = ['site_title', 'site_heading', 'gallery_card_aspect_ratio']


@bp.route('/site-settings', methods=['GET'])
def get_public_settings():
    settings = {}
    for key in SETTINGS_KEYS:
        settings[key] = SiteSettings.get(key)
    settings['has_favicon'] = os.path.exists(_favicon_path())
    return jsonify(settings), 200


@bp.route('/admin/site-settings', methods=['GET'])
@admin_required
def get_all_settings():
    settings = {}
    for key in SETTINGS_KEYS:
        settings[key] = SiteSettings.get(key)
    settings['has_favicon'] = os.path.exists(_favicon_path())
    return jsonify(settings), 200


@bp.route('/admin/site-settings', methods=['PUT'])
@admin_required
def update_settings():
    data = request.get_json()
    for key in SETTINGS_KEYS:
        if key in data:
            SiteSettings.set(key, data[key] or None)
    return jsonify({'message': 'Settings updated'}), 200


@bp.route('/admin/site-settings/favicon', methods=['POST'])
@admin_required
def upload_favicon():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not file.filename.lower().endswith(('.png', '.ico', '.jpg', '.jpeg')):
        return jsonify({'error': 'File must be PNG, JPG, or ICO'}), 400

    favicon_path = _favicon_path()
    os.makedirs(os.path.dirname(favicon_path), exist_ok=True)

    if file.filename.lower().endswith('.ico'):
        file.save(favicon_path)
    else:
        img = PILImage.open(file.stream)
        img = img.convert('RGBA')
        sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
        img.save(favicon_path, format='ICO', sizes=sizes)

    return jsonify({'message': 'Favicon uploaded'}), 200


@bp.route('/admin/site-settings/favicon', methods=['DELETE'])
@admin_required
def delete_favicon():
    favicon_path = _favicon_path()
    if os.path.exists(favicon_path):
        os.remove(favicon_path)
    return jsonify({'message': 'Favicon removed'}), 200


@bp.route('/favicon.ico', methods=['GET'])
def serve_favicon():
    favicon_path = _favicon_path()
    if not os.path.exists(favicon_path):
        return '', 404
    return send_file(favicon_path, mimetype='image/x-icon')


def _favicon_path():
    return os.path.join(current_app.config['GALLERY_DATA_PATH'], 'site', 'favicon.ico')
