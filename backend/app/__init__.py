import os
from flask import Flask
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from flask_compress import Compress
from flask_caching import Cache
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

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

    # Behind Traefik (or any reverse proxy) the socket peer is the proxy, so
    # request.remote_addr would be the proxy IP. Trust the X-Forwarded-* headers
    # for the configured number of proxy hops so remote_addr is the real client.
    proxy_hops = app.config['PROXY_FIX_HOPS']
    if proxy_hops:
        app.wsgi_app = ProxyFix(
            app.wsgi_app, x_for=proxy_hops, x_proto=proxy_hops,
            x_host=proxy_hops, x_port=proxy_hops
        )

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

        from app.api import galleries, images, admin, downloads, site_settings
        app.register_blueprint(galleries.bp)
        app.register_blueprint(images.bp)
        app.register_blueprint(admin.bp)
        app.register_blueprint(downloads.bp)
        app.register_blueprint(site_settings.bp)

    return app
