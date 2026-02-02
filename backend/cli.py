import sys
from app import create_app, bcrypt
from app.models import db, Admin


def create_admin(username, email, password):
    app = create_app()
    with app.app_context():
        existing = Admin.query.filter((Admin.username == username) | (Admin.email == email)).first()
        if existing:
            print(f"Error: Admin with username '{username}' or email '{email}' already exists")
            sys.exit(1)

        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

        admin = Admin(
            username=username,
            email=email,
            password_hash=password_hash,
            is_active=True
        )

        db.session.add(admin)
        db.session.commit()

        print(f"Admin user '{username}' created successfully!")
        print(f"Email: {email}")
        print(f"ID: {admin.id}")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python cli.py <command> [args]")
        print("Commands:")
        print("  create-admin <username> <email> <password>")
        sys.exit(1)

    command = sys.argv[1]

    if command == 'create-admin':
        if len(sys.argv) != 5:
            print("Usage: python cli.py create-admin <username> <email> <password>")
            sys.exit(1)
        create_admin(sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
