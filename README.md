# Photo Gallery Web Application

A modern photo gallery web application with Flask backend, React frontend, and Docker Compose deployment.

## Features

- Public and private galleries with password protection
- Image uploads with automatic thumbnail generation
- Watermarking support
- Lazy loading for optimal performance
- ZIP downloads of entire galleries
- Admin panel for gallery and image management
- Responsive Material UI design
- Production-ready deployment with Traefik and Let's Encrypt

## Technology Stack

### Backend
- Python 3.14.2
- Flask 3.1.2
- SQLAlchemy with MariaDB
- Redis for caching
- Pillow for image processing

### Frontend
- React 19.2.4
- Material UI 7.3.7
- React Router 7.13.0
- Vite 7.3.1

### Infrastructure
- Docker Compose
- Traefik 3.6.7 (reverse proxy with SSL)
- MariaDB 11.8.5
- Redis 7.4

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Just command runner (optional but recommended)

### Setup

1. Clone the repository

2. Copy the environment template and configure:
```bash
cp .env.example .env
```

Edit `.env` and set your values for:
- `DOMAIN`: Your domain name
- `ACME_EMAIL`: Email for Let's Encrypt
- Database passwords
- Redis password
- Flask secret key

3. Start the development environment:
```bash
just dev
```

Or without just:
```bash
docker compose up -d
```

4. Create an admin account:
```bash
just create-admin myusername admin@example.com mypassword
```

5. Access the application:
- Public gallery: http://localhost
- Admin panel: http://localhost/admin

## Available Commands

Using the `justfile`:

- `just dev` - Start development environment
- `just deploy` - Start production environment
- `just stop` - Stop all containers
- `just logs` - Follow all logs
- `just logs-backend` - Follow backend logs
- `just logs-frontend` - Follow frontend logs
- `just test` - Run backend tests
- `just create-admin <username> <email> <password>` - Create admin account
- `just backup` - Backup database and files
- `just clean` - Remove all containers and volumes
- `just rebuild` - Rebuild containers from scratch

## Project Structure

```
gallery/
├── backend/           # Flask API
│   ├── app/
│   │   ├── api/      # API endpoints
│   │   ├── models.py # Database models
│   │   ├── services/ # Business logic
│   │   └── utils/    # Utilities
│   ├── tests/        # Unit and integration tests
│   └── cli.py        # CLI commands
├── frontend/         # React application
│   └── src/
│       ├── components/
│       ├── hooks/
│       └── services/
├── traefik/          # Traefik configuration
├── compose.yml       # Docker services
└── justfile          # Command shortcuts
```

## Development

### Backend Development

The backend uses hot-reload in development mode. Changes to Python files will automatically restart the server.

Run tests:
```bash
just test
```

### Frontend Development

The frontend uses Vite's HMR (Hot Module Replacement). Changes will be reflected immediately.

Access the frontend dev server directly: http://localhost:5173

### Database Access

Connect to the database:
```bash
just shell-db
```

## Production Deployment

1. Configure your domain and SSL in `.env`
2. Remove `compose.override.yml` or rename it
3. Deploy:
```bash
just deploy
```

Traefik will automatically obtain SSL certificates from Let's Encrypt.

## Backup and Restore

Create a backup:
```bash
just backup
```

This creates:
- `backups/backup-YYYYMMDD-HHMMSS.sql` - Database dump
- `backups/backup-YYYYMMDD-HHMMSS.tar.gz` - Gallery files

## API Documentation

### Public Endpoints

- `GET /api/galleries` - List public galleries
- `GET /api/galleries/:slug` - Get gallery details
- `POST /api/galleries/:slug/authenticate` - Authenticate to private gallery
- `GET /images/thumbnails/:gallery_id/:image_id?size=medium` - Get thumbnail
- `GET /images/full/:gallery_id/:image_id` - Get full image
- `POST /api/galleries/:slug/download` - Request ZIP download
- `GET /api/downloads/:task_id/status` - Check ZIP status
- `GET /api/downloads/:task_id/file` - Download ZIP file

### Admin Endpoints

All admin endpoints require authentication.

- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/me` - Get current admin
- `GET /api/admin/galleries` - List all galleries
- `POST /api/admin/galleries` - Create gallery
- `GET /api/admin/galleries/:id` - Get gallery
- `PUT /api/admin/galleries/:id` - Update gallery
- `DELETE /api/admin/galleries/:id` - Delete gallery
- `POST /api/admin/galleries/:id/images` - Upload image
- `DELETE /api/admin/images/:id` - Delete image
- `PUT /api/admin/images/:id/order` - Update image order
- `GET /api/auth/admin/metrics` - Dashboard metrics
- `GET /api/auth/admin/audit-logs` - Audit logs

## License

MIT License
