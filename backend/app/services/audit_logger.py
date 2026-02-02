from app.models import db, AuditLog


def log_action(admin_id, action, resource_type, resource_id=None, details=None, ip_address=None):
    audit_log = AuditLog(
        admin_id=admin_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address
    )
    db.session.add(audit_log)
    db.session.commit()
    return audit_log
