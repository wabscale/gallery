import os
from datetime import timedelta


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }

    REDIS_URL = os.environ.get('REDIS_URL')

    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = os.environ.get('REDIS_URL')
    CACHE_DEFAULT_TIMEOUT = 3600

    SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)

    MAX_UPLOAD_SIZE = int(os.environ.get('MAX_UPLOAD_SIZE', 524288000))
    CHUNK_SIZE = int(os.environ.get('CHUNK_SIZE', 5242880))
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}

    GALLERY_DATA_PATH = '/app/data/galleries'
    TEMP_UPLOAD_PATH = '/app/data/temp'
    ZIP_OUTPUT_PATH = '/app/data/zips'

    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

    # Number of trusted reverse proxies (e.g. Traefik) in front of the app.
    # Controls how many values ProxyFix trusts from X-Forwarded-* headers so
    # that request.remote_addr resolves to the real client IP. Set to match
    # your deployment; 0 disables proxy header trust.
    PROXY_FIX_HOPS = int(os.environ.get('PROXY_FIX_HOPS', 1))

    COMPRESS_MIMETYPES = [
        'text/html',
        'text/css',
        'text/xml',
        'text/plain',
        'application/json',
        'application/javascript',
        'image/svg+xml',
    ]
    COMPRESS_ALGORITHM = ['br', 'gzip', 'deflate']
    COMPRESS_MIN_SIZE = 500
    COMPRESS_LEVEL = 6
    COMPRESS_BR_LEVEL = 4


class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'test': TestConfig,
    'default': ProductionConfig
}
