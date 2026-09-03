.PHONY: help up down build logs seed migrate shell test lint

SERVICES ?= postgres redis rabbitmq minio elasticsearch

help:
	@echo "Usage:"
	@echo "  make up          Start all infra containers"
	@echo "  make up-all      Start infra + all services"
	@echo "  make down        Stop everything"
	@echo "  make build       Build all service images"
	@echo "  make logs        Tail all logs"
	@echo "  make seed        Run seed data script"
	@echo "  make migrate     Run Alembic migrations for all services"
	@echo "  make test        Run all tests"
	@echo "  make lint        Run ruff on all services"

up:
	docker compose up -d $(SERVICES)

up-all:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

seed:
	@cp -n .env.example .env 2>/dev/null || true
	@pip install -q asyncpg sqlalchemy[asyncio] faker
	python scripts/seed_data.py

migrate:
	@for svc in auth-service compliance-service inspection-service violation-service notification-service; do \
		echo "==> $$svc"; \
		cd services/$$svc && alembic upgrade head && cd ../..; \
	done

shell-%:
	docker compose exec $* sh

test:
	@for svc in auth-service compliance-service inspection-service violation-service; do \
		echo "==> $$svc tests"; \
		cd services/$$svc && python -m pytest tests/ -q && cd ../..; \
	done

lint:
	ruff check services/ packages/

init-buckets:
	docker compose exec minio mc alias set local http://localhost:9000 $(MINIO_ACCESS_KEY) $(MINIO_SECRET_KEY)
	docker compose exec minio mc mb --ignore-existing local/cms-docs
