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
    docker compose exec -T mariadb mysqldump -u root -p${MARIADB_ROOT_PASSWORD} ${MARIADB_DATABASE} > backups/backup-${TIMESTAMP}.sql
    docker compose exec -T backend tar -I pigz -cf - -C /app/data . > backups/backup-${TIMESTAMP}.tar.gz
    echo "Backup complete: backups/backup-${TIMESTAMP}.{sql,tar.gz}"

restore sql tarball:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "Restoring database from {{sql}}..."
    docker compose exec -T mariadb mysql -u root -p${MARIADB_ROOT_PASSWORD} ${MARIADB_DATABASE} < {{sql}}
    echo "Restoring gallery files from {{tarball}}..."
    docker compose exec -T backend tar -I pigz -xf - -C /app/data < {{tarball}}
    echo "Restore complete."

shell-backend:
    docker compose exec backend /bin/bash

shell-db:
    docker compose exec mariadb mysql -u ${MARIADB_USER} -p${MARIADB_PASSWORD} ${MARIADB_DATABASE}

clean:
    docker compose down -v
    rm -rf backups/

rebuild:
    docker compose down
    docker compose build --no-cache
    docker compose up -d

ps:
    docker compose ps
