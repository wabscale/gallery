import os
from flask import Flask
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_compress import Compress
from flask_caching import Cache
from flask_cors import CORS

from app.config import config
from app.models import db, Admin

login_manager = LoginManager()
bcrypt = Bcrypt()
compress = Compress()
cache = Cache()


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'production')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)
    login_manager.init_app(app)
    bcrypt.init_app(app)
    compress.init_app(app)
    cache.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)

    login_manager.login_view = 'admin.login'
    login_manager.session_protection = 'strong'

    @login_manager.user_loader
    def load_user(user_id):
        return Admin.query.get(int(user_id))

    with app.app_context():
        os.makedirs(app.config['GALLERY_DATA_PATH'], exist_ok=True)
        os.makedirs(app.config['TEMP_UPLOAD_PATH'], exist_ok=True)
        os.makedirs(app.config['ZIP_OUTPUT_PATH'], exist_ok=True)

        db.create_all()

        from app.api import galleries, images, admin, downloads
        app.register_blueprint(galleries.bp)
        app.register_blueprint(images.bp)
        app.register_blueprint(admin.bp)
        app.register_blueprint(downloads.bp)

    return app
