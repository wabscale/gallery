import os
import re
import secrets
from datetime import timezone
from werkzeug.utils import secure_filename


def slugify(text):
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')


def generate_unique_filename(original_filename):
    name, ext = os.path.splitext(secure_filename(original_filename))
    random_suffix = secrets.token_hex(8)
    return f"{name}_{random_suffix}{ext}"


def allowed_file(filename, allowed_extensions):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions


def format_file_size(size_bytes):
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"


def to_utc_iso(dt):
    """Serialize a stored datetime with an explicit UTC offset.

    Columns are written with datetime.utcnow(), so naive values are UTC.
    Without the offset, browsers parse the string as local time and events
    show up hours off (often in the future).
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()

