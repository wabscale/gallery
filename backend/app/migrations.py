from sqlalchemy import inspect, text

from app.models import db, GalleryCredit


def migrate_photographer_instagram():
    # Galleries used to store a single photographer_instagram column. Move any
    # existing values into gallery_credits as Photographer credits, then drop
    # the old column. Safe to run repeatedly: it no-ops once the column is gone.
    columns = {c['name'] for c in inspect(db.engine).get_columns('galleries')}
    if 'photographer_instagram' not in columns:
        return

    rows = db.session.execute(text(
        "SELECT id, photographer_instagram FROM galleries "
        "WHERE photographer_instagram IS NOT NULL AND photographer_instagram != ''"
    )).all()
    for gallery_id, instagram in rows:
        db.session.add(GalleryCredit(
            gallery_id=gallery_id,
            role=GalleryCredit.DEFAULT_ROLE,
            instagram=instagram,
            order=0,
        ))
    db.session.commit()

    db.session.execute(text("ALTER TABLE galleries DROP COLUMN photographer_instagram"))
    db.session.commit()
