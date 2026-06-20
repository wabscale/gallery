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
    description = db.Column(db.Text, nullable=True)
    photographer_instagram = db.Column(db.String(100), nullable=True)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    is_public = db.Column(db.Boolean, default=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)
    allow_download = db.Column(db.Boolean, default=True, nullable=False)
    thumbnail_only = db.Column(db.Boolean, default=False, nullable=False)
    collect_emails = db.Column(db.Boolean, default=False, nullable=False)
    watermark_enabled = db.Column(db.Boolean, default=False, nullable=False)
    watermark_opacity = db.Column(db.Integer, default=30, nullable=False)
    watermark_text = db.Column(db.String(200), nullable=True)
    watermark_position = db.Column(db.String(30), default='bottom_right', nullable=False)
    watermark_position_thumbnail = db.Column(db.String(30), default='bottom_right', nullable=False)
    watermark_color = db.Column(db.String(7), default='#ffffff', nullable=False)
    watermark_font = db.Column(db.String(30), default='dejavu_sans', nullable=False)
    watermark_font_size = db.Column(db.Integer, default=0, nullable=False)
    watermark_type = db.Column(db.String(10), default='text', nullable=False)
    watermark_image_path = db.Column(db.String(500), nullable=True)
    watermark_repeat = db.Column(db.String(10), default='none', nullable=False)
    watermark_spacing = db.Column(db.Integer, default=100, nullable=False)
    watermark_grid_angle = db.Column(db.Integer, default=0, nullable=False)
    watermark_quality = db.Column(db.Integer, default=95, nullable=False)
    thumbnail_quality = db.Column(db.Integer, default=85, nullable=False)
    image_sort = db.Column(db.String(30), default='name_asc', nullable=False)
    thumbnail_aspect_ratio = db.Column(db.String(10), default='4x5', nullable=False)
    hover_animation = db.Column(db.String(20), default='crossfade', nullable=False)
    cover_image_id = db.Column(db.Integer, nullable=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    images = db.relationship('Image', backref='gallery', lazy='dynamic', cascade='all, delete-orphan', order_by='Image.order')
    access_logs = db.relationship('GalleryAccessLog', backref='gallery', lazy='dynamic', cascade='all, delete-orphan')

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
    is_hidden = db.Column(db.Boolean, default=False, nullable=False)
    order = db.Column(db.Integer, default=0, nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    file_modified_at = db.Column(db.DateTime, nullable=True)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=False)

    def __repr__(self):
        return f'<Image {self.filename}>'


class GalleryAccessLog(db.Model):
    __tablename__ = 'gallery_access_logs'
    __table_args__ = (
        db.Index('idx_access_gallery_email', 'gallery_id', 'email'),
        db.Index('idx_access_created', 'created_at'),
    )

    id = db.Column(db.Integer, primary_key=True)
    gallery_id = db.Column(db.Integer, db.ForeignKey('galleries.id'), nullable=False, index=True)
    email = db.Column(db.String(255), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    image_id = db.Column(db.Integer, db.ForeignKey('images.id'), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    image = db.relationship('Image', backref='access_logs')

    def __repr__(self):
        return f'<GalleryAccessLog {self.email} {self.action}>'


class SiteSettings(db.Model):
    __tablename__ = 'site_settings'

    key = db.Column(db.String(100), primary_key=True)
    value = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f'<SiteSettings {self.key}>'

    @staticmethod
    def get(key, default=None):
        setting = SiteSettings.query.get(key)
        return setting.value if setting else default

    @staticmethod
    def set(key, value):
        setting = SiteSettings.query.get(key)
        if setting:
            setting.value = value
        else:
            setting = SiteSettings(key=key, value=value)
            db.session.add(setting)
        db.session.commit()


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
