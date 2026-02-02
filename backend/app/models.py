from datetime import datetime
from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Admin(UserMixin, db.Model):
    __tablename__ = 'admins'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    galleries = db.relationship('Gallery', backref='owner', lazy='dynamic', cascade='all, delete-orphan')
    audit_logs = db.relationship('AuditLog', backref='admin', lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Admin {self.username}>'


class Gallery(db.Model):
    __tablename__ = 'galleries'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    is_public = db.Column(db.Boolean, default=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)
    allow_download = db.Column(db.Boolean, default=True, nullable=False)
    thumbnail_only = db.Column(db.Boolean, default=False, nullable=False)
    watermark_enabled = db.Column(db.Boolean, default=False, nullable=False)
    watermark_opacity = db.Column(db.Integer, default=30, nullable=False)
    thumbnail_quality = db.Column(db.Integer, default=85, nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    images = db.relationship('Image', backref='gallery', lazy='dynamic', cascade='all, delete-orphan', order_by='Image.order')

    def __repr__(self):
        return f'<Gallery {self.name}>'

    @property
    def image_count(self):
        return self.images.count()


class Image(db.Model):
    __tablename__ = 'images'
    __table_args__ = (db.Index('idx_gallery_order', 'gallery_id', 'order'),)

    id = db.Column(db.Integer, primary_key=True)
    gallery_id = db.Column(db.Integer, db.ForeignKey('galleries.id'), nullable=False, index=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    width = db.Column(db.Integer, nullable=False)
    height = db.Column(db.Integer, nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    order = db.Column(db.Integer, default=0, nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=False)

    def __repr__(self):
        return f'<Image {self.filename}>'


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    __table_args__ = (
        db.Index('idx_admin_created', 'admin_id', 'created_at'),
        db.Index('idx_created_at', 'created_at'),
    )

    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    resource_type = db.Column(db.String(50), nullable=False)
    resource_id = db.Column(db.Integer, nullable=True)
    details = db.Column(db.JSON, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __repr__(self):
        return f'<AuditLog {self.action} by Admin#{self.admin_id}>'
