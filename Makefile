ifneq ("$(wildcard .env)","")
	include .env
endif

SHELL := /bin/bash

DEV_ENV_FILE ?= .env
PROD_ENV_FILE ?= .env.prod
BETA_ENV_FILE ?= .env.beta

DEV_PROJECT_NAME ?= reelreview-dev
PROD_PROJECT_NAME ?= reelreview-prod
BETA_PROJECT_NAME ?= reelreview-beta

DEV_BACKUP_DIR ?= db-backups/dev
PROD_BACKUP_DIR ?= db-backups/prod
BETA_BACKUP_DIR ?= db-backups/beta

DEV_COMPOSE = APP_ENV_FILE=$(DEV_ENV_FILE) docker compose --env-file $(DEV_ENV_FILE) -p $(DEV_PROJECT_NAME) -f docker-compose.yml
PROD_COMPOSE = APP_ENV_FILE=$(PROD_ENV_FILE) docker compose --env-file $(PROD_ENV_FILE) -p $(PROD_PROJECT_NAME) -f docker-compose.prod.yml
BETA_COMPOSE = APP_ENV_FILE=$(BETA_ENV_FILE) docker compose --env-file $(BETA_ENV_FILE) -p $(BETA_PROJECT_NAME) -f docker-compose.prod.yml

.PHONY: dev dev-down build db-shell db-migrate test-frontend test-backend setup setup-prod setup-beta \
	prod-up prod-down prod-build prod-logs prod-db-shell prod-db-backup prod-db-restore prod-db-migrate \
	beta-up beta-down beta-build beta-logs beta-db-shell beta-db-backup beta-db-restore beta-db-migrate \
	db-seed db-unseed

define banner
	@printf "\n========== %s ==========\n" "$(1)"
endef

define confirm
	@printf "%s Type '%s' to continue: " "$(1)" "$(2)"; \
	read answer; \
	if [ "$$answer" != "$(2)" ]; then \
		echo "Cancelled."; \
		exit 1; \
	fi
endef

dev:
	$(call banner,LOCAL DEV STACK)
	@echo "Env file: $(DEV_ENV_FILE)"
	@echo "Compose project: $(DEV_PROJECT_NAME)"
	$(DEV_COMPOSE) up --build

dev-down:
	$(call banner,STOP LOCAL DEV STACK)
	$(DEV_COMPOSE) down

build:
	$(call banner,BUILD LOCAL DEV IMAGES)
	$(DEV_COMPOSE) build

db-shell:
	$(call banner,LOCAL DEV DB SHELL)
	$(DEV_COMPOSE) exec -e PGPASSWORD=$$(grep '^POSTGRES_PASSWORD=' $(DEV_ENV_FILE) | cut -d= -f2-) db psql -U $$(grep '^POSTGRES_USER=' $(DEV_ENV_FILE) | cut -d= -f2-) -d $$(grep '^POSTGRES_DB=' $(DEV_ENV_FILE) | cut -d= -f2-)

db-migrate:
	$(call banner,LOCAL DEV DB MIGRATION)
	$(DEV_COMPOSE) exec backend alembic upgrade head

test-frontend:
	$(call banner,FRONTEND TESTS ON LOCAL DEV STACK)
	$(DEV_COMPOSE) run --rm --no-deps --build frontend npm run test -- --run

test-backend:
	$(call banner,BACKEND TESTS ON LOCAL DEV STACK)
	$(DEV_COMPOSE) run --rm --no-deps --build backend poetry run pytest

db-seed:
	$(call banner,SEED LOCAL DEV DATABASE)
	if python3 -c "import socket; s=socket.socket(); s.settimeout(1); s.connect(('127.0.0.1', $(POSTGRES_PORT))); s.close()" >/dev/null 2>&1; then \
		cd backend && POSTGRES_HOST=127.0.0.1 POSTGRES_PORT=$(POSTGRES_PORT) poetry run python -m app.seed seed; \
	else \
		$(DEV_COMPOSE) run --rm --no-deps backend python -m app.seed seed; \
	fi

db-unseed:
	$(call banner,UNSEED LOCAL DEV DATABASE)
	if python3 -c "import socket; s=socket.socket(); s.settimeout(1); s.connect(('127.0.0.1', $(POSTGRES_PORT))); s.close()" >/dev/null 2>&1; then \
		cd backend && POSTGRES_HOST=127.0.0.1 POSTGRES_PORT=$(POSTGRES_PORT) poetry run python -m app.seed unseed; \
	else \
		$(DEV_COMPOSE) run --rm --no-deps backend python -m app.seed unseed; \
	fi

setup:
	cp .env.example .env
	@echo "Created local dev env file at .env"

setup-prod:
	cp .env.prod.example .env.prod
	@echo "Created production env template at .env.prod"
	@echo "Fill in real production secrets before running make prod-up"

setup-beta:
	cp .env.beta.example .env.beta
	@echo "Created beta env template at .env.beta"
	@echo "Fill in real beta secrets before running make beta-up"

prod-up:
	$(call banner,PRODUCTION STACK)
	@echo "Env file: $(PROD_ENV_FILE)"
	@echo "Compose project: $(PROD_PROJECT_NAME)"
	@echo "Target URL: https://reelreview.bynolo.ca"
	$(call confirm,You are about to build and start PRODUCTION.,prod)
	$(PROD_COMPOSE) up --build -d

prod-down:
	$(call banner,STOP PRODUCTION STACK)
	@echo "Env file: $(PROD_ENV_FILE)"
	$(call confirm,You are about to stop PRODUCTION.,prod)
	$(PROD_COMPOSE) down

prod-build:
	$(call banner,BUILD PRODUCTION IMAGES)
	@echo "Env file: $(PROD_ENV_FILE)"
	$(call confirm,You are about to rebuild PRODUCTION images.,prod)
	$(PROD_COMPOSE) build

prod-logs:
	$(call banner,PRODUCTION LOGS)
	@echo "Env file: $(PROD_ENV_FILE)"
	$(PROD_COMPOSE) logs -f

prod-db-shell:
	$(call banner,PRODUCTION DB SHELL)
	@echo "Env file: $(PROD_ENV_FILE)"
	$(call confirm,You are about to open the PRODUCTION database shell.,prod)
	$(PROD_COMPOSE) exec -e PGPASSWORD=$$(grep '^POSTGRES_PASSWORD=' $(PROD_ENV_FILE) | cut -d= -f2-) db psql -U $$(grep '^POSTGRES_USER=' $(PROD_ENV_FILE) | cut -d= -f2-) -d $$(grep '^POSTGRES_DB=' $(PROD_ENV_FILE) | cut -d= -f2-)

prod-db-backup:
	$(call banner,PRODUCTION DB BACKUP)
	@echo "Backup directory: $(PROD_BACKUP_DIR)"
	@mkdir -p $(PROD_BACKUP_DIR)
	$(PROD_COMPOSE) exec -T db pg_dump -U $$(grep '^POSTGRES_USER=' $(PROD_ENV_FILE) | cut -d= -f2-) -d $$(grep '^POSTGRES_DB=' $(PROD_ENV_FILE) | cut -d= -f2-) > $(PROD_BACKUP_DIR)/reelreview-prod-$(shell date +%F-%H%M%S).sql

prod-db-restore:
	$(call banner,PRODUCTION DB RESTORE)
	@echo "Backup directory: $(PROD_BACKUP_DIR)"
	$(call confirm,You are about to restore into the PRODUCTION database.,prod)
	APP_ENV_FILE=$(PROD_ENV_FILE) COMPOSE_PROJECT_NAME=$(PROD_PROJECT_NAME) python3 scripts/db_restore_cli.py --backup-dir $(PROD_BACKUP_DIR) --compose-file docker-compose.prod.yml --project-name $(PROD_PROJECT_NAME) --env-file $(PROD_ENV_FILE)

prod-db-migrate:
	$(call banner,PRODUCTION DB MIGRATION)
	@echo "Env file: $(PROD_ENV_FILE)"
	$(call confirm,You are about to run migrations against PRODUCTION.,prod)
	$(PROD_COMPOSE) exec backend alembic upgrade head

beta-up:
	$(call banner,BETA STACK)
	@echo "Env file: $(BETA_ENV_FILE)"
	@echo "Compose project: $(BETA_PROJECT_NAME)"
	@echo "Target URL: https://beta-reelreview.bynolo.ca"
	$(call confirm,You are about to build and start BETA.,beta)
	$(BETA_COMPOSE) up --build -d

beta-down:
	$(call banner,STOP BETA STACK)
	@echo "Env file: $(BETA_ENV_FILE)"
	$(call confirm,You are about to stop BETA.,beta)
	$(BETA_COMPOSE) down

beta-build:
	$(call banner,BUILD BETA IMAGES)
	@echo "Env file: $(BETA_ENV_FILE)"
	$(call confirm,You are about to rebuild BETA images.,beta)
	$(BETA_COMPOSE) build

beta-logs:
	$(call banner,BETA LOGS)
	@echo "Env file: $(BETA_ENV_FILE)"
	$(BETA_COMPOSE) logs -f

beta-db-shell:
	$(call banner,BETA DB SHELL)
	@echo "Env file: $(BETA_ENV_FILE)"
	$(call confirm,You are about to open the BETA database shell.,beta)
	$(BETA_COMPOSE) exec -e PGPASSWORD=$$(grep '^POSTGRES_PASSWORD=' $(BETA_ENV_FILE) | cut -d= -f2-) db psql -U $$(grep '^POSTGRES_USER=' $(BETA_ENV_FILE) | cut -d= -f2-) -d $$(grep '^POSTGRES_DB=' $(BETA_ENV_FILE) | cut -d= -f2-)

beta-db-backup:
	$(call banner,BETA DB BACKUP)
	@echo "Backup directory: $(BETA_BACKUP_DIR)"
	@mkdir -p $(BETA_BACKUP_DIR)
	$(BETA_COMPOSE) exec -T db pg_dump -U $$(grep '^POSTGRES_USER=' $(BETA_ENV_FILE) | cut -d= -f2-) -d $$(grep '^POSTGRES_DB=' $(BETA_ENV_FILE) | cut -d= -f2-) > $(BETA_BACKUP_DIR)/reelreview-beta-$(shell date +%F-%H%M%S).sql

beta-db-restore:
	$(call banner,BETA DB RESTORE)
	@echo "Backup directory: $(BETA_BACKUP_DIR)"
	$(call confirm,You are about to restore into the BETA database.,beta)
	APP_ENV_FILE=$(BETA_ENV_FILE) COMPOSE_PROJECT_NAME=$(BETA_PROJECT_NAME) python3 scripts/db_restore_cli.py --backup-dir $(BETA_BACKUP_DIR) --compose-file docker-compose.prod.yml --project-name $(BETA_PROJECT_NAME) --env-file $(BETA_ENV_FILE)

beta-db-migrate:
	$(call banner,BETA DB MIGRATION)
	@echo "Env file: $(BETA_ENV_FILE)"
	$(call confirm,You are about to run migrations against BETA.,beta)
	$(BETA_COMPOSE) exec backend alembic upgrade head
