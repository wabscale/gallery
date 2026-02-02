from functools import wraps
from flask import request, jsonify
from flask_login import current_user
from app.services.audit_logger import log_action


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({'error': 'Authentication required'}), 401
        if not current_user.is_active:
            return jsonify({'error': 'Account is inactive'}), 403
        return f(*args, **kwargs)
    return decorated_function


def audit_log(action, resource_type):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            result = f(*args, **kwargs)

            if current_user.is_authenticated:
                resource_id = kwargs.get('id') or kwargs.get('gallery_id') or kwargs.get('image_id')
                details = {'endpoint': request.endpoint, 'method': request.method}

                log_action(
                    admin_id=current_user.id,
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    details=details,
                    ip_address=request.remote_addr
                )

            return result
        return decorated_function
    return decorator
