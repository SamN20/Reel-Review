.PHONY: dev prod down build build-prod db-shell test-frontend test-backend clean setup

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
	docker compose exec db psql -U postgres -d app_db

test-frontend:
	docker compose exec frontend npm run test

test-backend:
	docker compose exec backend pytest

setup:
	cp .env.example .env
