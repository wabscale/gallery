import os
import threading
from datetime import datetime
from stream_zip import stream_zip, ZIP_64
from redis import Redis
from flask import current_app


def create_zip_task(gallery, images, task_id, redis_url):
    def generate_zip():
        try:
            redis_client = Redis.from_url(redis_url)
            redis_client.setex(f'zip_task:{task_id}', 3600, 'processing')

            zip_filename = f"{gallery.slug}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
            zip_path = os.path.join(current_app.config['ZIP_OUTPUT_PATH'], zip_filename)

            def member_files():
                for image in images:
                    file_path = image.file_path
                    modified_at = image.uploaded_at.timestamp()
                    perms = 0o600

                    def file_bytes():
                        with open(file_path, 'rb') as f:
                            while chunk := f.read(65536):
                                yield chunk

                    yield image.original_filename, modified_at, perms, ZIP_64, file_bytes()

            with open(zip_path, 'wb') as f:
                for chunk in stream_zip(member_files()):
                    f.write(chunk)

            redis_client.setex(f'zip_task:{task_id}', 3600, f'ready:{zip_filename}')

        except Exception as e:
            redis_client.setex(f'zip_task:{task_id}', 3600, f'error:{str(e)}')

    thread = threading.Thread(target=generate_zip)
    thread.start()
    return thread
