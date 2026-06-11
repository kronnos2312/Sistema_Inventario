ENV_DIR := envs

.PHONY: dev test prod \
        down-dev down-test down-prod \
        logs-dev logs-test logs-prod \
        build-dev build-test build-prod \
        clean help

# ─────────────────────────────────────────────────────────────────────────────
# Levantar
# ─────────────────────────────────────────────────────────────────────────────

dev: _check-env-dev
	docker compose -f docker-compose.yml -f docker-compose.dev.yml \
	  --env-file $(ENV_DIR)/.env.dev up --build

test: _check-env-test
	docker compose -f docker-compose.yml -f docker-compose.test.yml \
	  --env-file $(ENV_DIR)/.env.test up --build

prod: _check-env-prod
	docker compose -f docker-compose.yml -f docker-compose.prod.yml \
	  --env-file $(ENV_DIR)/.env.prod up --build -d

# ─────────────────────────────────────────────────────────────────────────────
# Solo construir imagen (sin levantar)
# ─────────────────────────────────────────────────────────────────────────────

build-dev: _check-env-dev
	docker compose -f docker-compose.yml -f docker-compose.dev.yml \
	  --env-file $(ENV_DIR)/.env.dev build

build-test: _check-env-test
	docker compose -f docker-compose.yml -f docker-compose.test.yml \
	  --env-file $(ENV_DIR)/.env.test build

build-prod: _check-env-prod
	docker compose -f docker-compose.yml -f docker-compose.prod.yml \
	  --env-file $(ENV_DIR)/.env.prod build

# ─────────────────────────────────────────────────────────────────────────────
# Detener
# ─────────────────────────────────────────────────────────────────────────────

down-dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml \
	  --env-file $(ENV_DIR)/.env.dev down

# down-test elimina el volumen de BD para garantizar arranque limpio
down-test:
	docker compose -f docker-compose.yml -f docker-compose.test.yml \
	  --env-file $(ENV_DIR)/.env.test down -v

down-prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml \
	  --env-file $(ENV_DIR)/.env.prod down

# ─────────────────────────────────────────────────────────────────────────────
# Logs
# ─────────────────────────────────────────────────────────────────────────────

logs-dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml \
	  --env-file $(ENV_DIR)/.env.dev logs -f

logs-test:
	docker compose -f docker-compose.yml -f docker-compose.test.yml \
	  --env-file $(ENV_DIR)/.env.test logs -f

logs-prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml \
	  --env-file $(ENV_DIR)/.env.prod logs -f

# ─────────────────────────────────────────────────────────────────────────────
# Limpieza total (dev + test; prod requiere confirmación manual)
# ─────────────────────────────────────────────────────────────────────────────

clean:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml \
	  --env-file $(ENV_DIR)/.env.dev down -v --remove-orphans 2>/dev/null || true
	docker compose -f docker-compose.yml -f docker-compose.test.yml \
	  --env-file $(ENV_DIR)/.env.test down -v --remove-orphans 2>/dev/null || true
	docker image prune -f

# ─────────────────────────────────────────────────────────────────────────────
# Validaciones internas
# ─────────────────────────────────────────────────────────────────────────────

_check-env-dev:
	@test -f $(ENV_DIR)/.env.dev || \
	  (echo "ERROR: $(ENV_DIR)/.env.dev no existe." && exit 1)

_check-env-test:
	@test -f $(ENV_DIR)/.env.test || \
	  (echo "ERROR: $(ENV_DIR)/.env.test no existe." && exit 1)

_check-env-prod:
	@test -f $(ENV_DIR)/.env.prod || \
	  (echo "ERROR: Crea $(ENV_DIR)/.env.prod desde $(ENV_DIR)/.env.prod.example" && exit 1)

# ─────────────────────────────────────────────────────────────────────────────
# Ayuda
# ─────────────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "  Comandos disponibles:"
	@echo ""
	@echo "  make dev          Levanta ambiente de desarrollo (foreground)"
	@echo "  make test         Levanta ambiente de pruebas (foreground)"
	@echo "  make prod         Levanta produccion en segundo plano (-d)"
	@echo ""
	@echo "  make build-dev    Solo construye la imagen dev"
	@echo "  make build-test   Solo construye la imagen test"
	@echo "  make build-prod   Solo construye la imagen prod"
	@echo ""
	@echo "  make down-dev     Detiene dev"
	@echo "  make down-test    Detiene test y elimina volumen de BD"
	@echo "  make down-prod    Detiene prod"
	@echo ""
	@echo "  make logs-dev     Muestra logs de dev en tiempo real"
	@echo "  make logs-test    Muestra logs de test en tiempo real"
	@echo "  make logs-prod    Muestra logs de prod en tiempo real"
	@echo ""
	@echo "  make clean        Baja dev y test, elimina imágenes sin uso"
	@echo ""
