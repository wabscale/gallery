from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, current_user
from app import bcrypt, cache
from app.models import db, Admin, AuditLog, Gallery, Image, GalleryAccessLog
from app.utils.decorators import admin_required, audit_log
from app.utils.helpers import to_utc_iso, resolve_timezone, count_by_local_day, local_weekday_hour_heatmap
from sqlalchemy import func

bp = Blueprint('admin', __name__, url_prefix='/api/auth')


@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    admin = Admin.query.filter_by(username=username).first()

    if not admin or not bcrypt.check_password_hash(admin.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    if not admin.is_active:
        return jsonify({'error': 'Account is inactive'}), 403

    login_user(admin, remember=True)

    return jsonify({
        'message': 'Login successful',
        'admin': {
            'id': admin.id,
            'username': admin.username,
            'email': admin.email
        }
    }), 200


@bp.route('/logout', methods=['POST'])
@admin_required
def logout():
    logout_user()
    return jsonify({'message': 'Logout successful'}), 200


@bp.route('/me', methods=['GET'])
@admin_required
def get_current_admin():
    return jsonify({
        'id': current_user.id,
        'username': current_user.username,
        'email': current_user.email,
        'created_at': to_utc_iso(current_user.created_at)
    }), 200


@bp.route('/admin/metrics', methods=['GET'])
@admin_required
def get_metrics():
    total_galleries = Gallery.query.count()
    total_images = Image.query.count()
    total_storage = db.session.query(func.sum(Image.file_size)).scalar() or 0

    recent_uploads = Image.query.order_by(Image.uploaded_at.desc()).limit(10).all()

    return jsonify({
        'total_galleries': total_galleries,
        'total_images': total_images,
        'total_storage': total_storage,
        'recent_uploads': [{
            'id': img.id,
            'filename': img.original_filename,
            'uploaded_at': to_utc_iso(img.uploaded_at)
        } for img in recent_uploads]
    }), 200


@bp.route('/admin/users', methods=['GET'])
@admin_required
def list_users():
    users = Admin.query.order_by(Admin.created_at.desc()).all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'is_active': u.is_active,
        'created_at': to_utc_iso(u.created_at),
    } for u in users]), 200


@bp.route('/admin/users', methods=['POST'])
@admin_required
@audit_log('create', 'admin')
def create_user():
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password are required'}), 400

    if Admin.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409

    if Admin.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 409

    admin = Admin(
        username=username,
        email=email,
        password_hash=bcrypt.generate_password_hash(password).decode('utf-8'),
        is_active=data.get('is_active', True),
    )
    db.session.add(admin)
    db.session.commit()

    return jsonify({
        'id': admin.id,
        'username': admin.username,
        'email': admin.email,
        'message': 'User created successfully',
    }), 201


@bp.route('/admin/users/<int:user_id>', methods=['PUT'])
@admin_required
@audit_log('update', 'admin')
def update_user(user_id):
    admin = Admin.query.get_or_404(user_id)
    data = request.get_json()

    if 'username' in data:
        username = data['username'].strip()
        existing = Admin.query.filter(Admin.username == username, Admin.id != admin.id).first()
        if existing:
            return jsonify({'error': 'Username already exists'}), 409
        admin.username = username

    if 'email' in data:
        email = data['email'].strip()
        existing = Admin.query.filter(Admin.email == email, Admin.id != admin.id).first()
        if existing:
            return jsonify({'error': 'Email already exists'}), 409
        admin.email = email

    if 'password' in data and data['password']:
        admin.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    if 'is_active' in data:
        if admin.id == current_user.id and not data['is_active']:
            return jsonify({'error': 'Cannot deactivate your own account'}), 400
        admin.is_active = data['is_active']

    db.session.commit()
    return jsonify({'message': 'User updated successfully'}), 200


@bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
@audit_log('delete', 'admin')
def delete_user(user_id):
    admin = Admin.query.get_or_404(user_id)

    if admin.id == current_user.id:
        return jsonify({'error': 'Cannot delete your own account'}), 400

    db.session.delete(admin)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'}), 200


@bp.route('/admin/audit-logs', methods=['GET'])
@admin_required
def get_audit_logs():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    pagination = AuditLog.query.order_by(AuditLog.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    logs = [{
        'id': log.id,
        'admin_id': log.admin_id,
        'action': log.action,
        'resource_type': log.resource_type,
        'resource_id': log.resource_id,
        'details': log.details,
        'ip_address': log.ip_address,
        'created_at': to_utc_iso(log.created_at)
    } for log in pagination.items]

    return jsonify({
        'logs': logs,
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages
    }), 200


def _storage_and_upload_rankings(since):
    storage_by_gallery = db.session.query(
        Gallery.name,
        func.sum(Image.file_size).label('total_size'),
        func.count(Image.id).label('image_count')
    ).join(Image, Gallery.id == Image.gallery_id).group_by(
        Gallery.id
    ).order_by(func.sum(Image.file_size).desc()).limit(10).all()

    uploads_by_gallery = db.session.query(
        Gallery.name,
        func.count(Image.id).label('count')
    ).join(Image, Gallery.id == Image.gallery_id).filter(
        Image.uploaded_at >= since
    ).group_by(Gallery.id).order_by(func.count(Image.id).desc()).limit(10).all()

    return (
        [{'name': r.name, 'size': r.total_size, 'count': r.image_count} for r in storage_by_gallery],
        [{'name': r.name, 'count': r.count} for r in uploads_by_gallery],
    )


@bp.route('/admin/activity', methods=['GET'])
@admin_required
@cache.cached(timeout=300, query_string=True)
def get_activity():
    """Activity charts bucketed by day/hour in the viewer's timezone.

    Timestamps are stored in UTC; the frontend passes its IANA zone in `tz`
    so days and hours line up with the admin's local clock.
    """
    days = request.args.get('days', 30, type=int)
    tz = resolve_timezone(request.args.get('tz', 'UTC'))
    if tz is None:
        return jsonify({'error': 'Unknown timezone'}), 400
    since = datetime.utcnow() - timedelta(days=days)

    upload_times = [r.uploaded_at for r in db.session.query(Image.uploaded_at).filter(Image.uploaded_at >= since)]
    access_rows = db.session.query(GalleryAccessLog.created_at, GalleryAccessLog.action).filter(
        GalleryAccessLog.created_at >= since
    ).all()
    storage_by_gallery, uploads_by_gallery = _storage_and_upload_rankings(since)

    return jsonify({
        'uploads_by_day': count_by_local_day(upload_times, tz),
        'views_by_day': count_by_local_day([r.created_at for r in access_rows if r.action == 'access'], tz),
        'downloads_by_day': count_by_local_day([r.created_at for r in access_rows if r.action == 'download_gallery'], tz),
        'storage_by_gallery': storage_by_gallery,
        'uploads_by_gallery': uploads_by_gallery,
        'activity_heatmap': local_weekday_hour_heatmap([r.created_at for r in access_rows], tz),
    }), 200
