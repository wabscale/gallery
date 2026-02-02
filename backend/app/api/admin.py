from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, current_user
from app import bcrypt
from app.models import db, Admin, AuditLog, Gallery, Image
from app.utils.decorators import admin_required, audit_log
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
        'created_at': current_user.created_at.isoformat()
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
            'uploaded_at': img.uploaded_at.isoformat()
        } for img in recent_uploads]
    }), 200


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
        'created_at': log.created_at.isoformat()
    } for log in pagination.items]

    return jsonify({
        'logs': logs,
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages
    }), 200
