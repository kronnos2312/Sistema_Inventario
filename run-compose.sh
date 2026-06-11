#!/bin/bash
# Uso: ./run-compose.sh [dev|test|prod]
#      Si no se pasa argumento se usa 'dev'.
set -e

ENV=${1:-dev}
ENV_FILE="envs/.env.${ENV}"
OVERRIDE="docker-compose.${ENV}.yml"

if [ ! -f "$ENV_FILE" ]; then
  if [ "$ENV" = "prod" ]; then
    echo "ERROR: $ENV_FILE no existe."
    echo "Crea el archivo desde la plantilla:"
    echo "  cp envs/.env.prod.example envs/.env.prod"
  else
    echo "ERROR: $ENV_FILE no existe."
    echo "Ambientes disponibles: dev | test | prod"
  fi
  exit 1
fi

echo "Iniciando ambiente: $ENV"
docker compose -f docker-compose.yml -f "$OVERRIDE" --env-file "$ENV_FILE" up --build
