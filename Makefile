ifneq ("$(wildcard .env)","")
	include .env
	export
endif

# Local backup directory for DB dumps (can be overridden)
BACKUP_DIR ?= db-backups

.PHONY: dev prod down build build-prod db-shell db-migrate db-seed db-unseed test-frontend test-backend clean setup

dev:
	docker compose -f docker-compose.yml up --build

prod:
	docker compose -f docker-compose.prod.yml up --build -d

down:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml down

build:
	docker compose -f docker-compose.yml build

build-prod:
	docker compose -f docker-compose.prod.yml build

db-shell:
	docker compose exec -e PGPASSWORD=$(POSTGRES_PASSWORD) db psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

db-backup:
	mkdir -p $(BACKUP_DIR)
	docker compose -f docker-compose.prod.yml exec -T db pg_dump -U $(POSTGRES_USER) -d $(POSTGRES_DB) > $(BACKUP_DIR)/reelreview-$(shell date +%F-%H%M%S).sql

db-restore:
	python3 scripts/db_restore_cli.py --backup-dir $(BACKUP_DIR)

db-migrate:
	docker compose exec backend alembic upgrade head

db-seed:
	if python3 -c "import socket; s=socket.socket(); s.settimeout(1); s.connect(('127.0.0.1', $(POSTGRES_PORT))); s.close()" >/dev/null 2>&1; then \
		cd backend && POSTGRES_HOST=127.0.0.1 POSTGRES_PORT=$(POSTGRES_PORT) poetry run python -m app.seed seed; \
	else \
		docker compose run --rm --no-deps backend python -m app.seed seed; \
	fi

db-unseed:
	if python3 -c "import socket; s=socket.socket(); s.settimeout(1); s.connect(('127.0.0.1', $(POSTGRES_PORT))); s.close()" >/dev/null 2>&1; then \
		cd backend && POSTGRES_HOST=127.0.0.1 POSTGRES_PORT=$(POSTGRES_PORT) poetry run python -m app.seed unseed; \
	else \
		docker compose run --rm --no-deps backend python -m app.seed unseed; \
	fi

test-frontend:
	docker compose run --rm --no-deps --build frontend npm run test -- --run

test-backend:
	docker compose run --rm --no-deps --build backend poetry run pytest

setup:
	cp .env.example .env
