#!/bin/bash
set -e

if [ ! -f .env ]; then
  echo "No se encontró .env — copiando desde .env.example..."
  cp .env.example .env
  echo "Revisa y ajusta .env antes de continuar si es necesario."
fi

echo "Iniciando Docker Compose (backend + frontend en contenedor único)..."
docker compose up --build
