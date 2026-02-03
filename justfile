default:
    @just --list

dev:
    docker compose up -d

deploy:
    docker compose -f compose.yml up -d --force-recreate --build

stop:
    docker compose down

restart:
    docker compose restart

logs:
    docker compose logs -f

logs-backend:
    docker compose logs -f backend

logs-frontend:
    docker compose logs -f frontend

test:
    docker compose exec backend pytest

create-admin username email password:
    docker compose exec backend python cli.py create-admin {{username}} {{email}} {{password}}

backup:
    #!/usr/bin/env bash
    set -euo pipefail
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    echo "Creating backup at ${TIMESTAMP}..."
    mkdir -p backups
    docker compose exec mariadb mysqldump -u root -p${MARIADB_ROOT_PASSWORD} ${MARIADB_DATABASE} > backups/backup-${TIMESTAMP}.sql
    tar -I pigz -cf backups/backup-${TIMESTAMP}.tar.gz data/
    echo "Backup complete: backups/backup-${TIMESTAMP}.{sql,tar.gz}"

shell-backend:
    docker compose exec backend /bin/bash

shell-db:
    docker compose exec mariadb mysql -u ${MARIADB_USER} -p${MARIADB_PASSWORD} ${MARIADB_DATABASE}

clean:
    docker compose down -v
    rm -rf data/ backups/

rebuild:
    docker compose down
    docker compose build --no-cache
    docker compose up -d

ps:
    docker compose ps
