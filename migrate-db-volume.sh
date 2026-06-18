#!/usr/bin/env bash
# Migra los datos del volumen Docker nombrado 'pgdata' al directorio configurado en DB_DATA_DIR.
# Ejecutar UNA SOLA VEZ antes de levantar los contenedores con DB_DATA_DIR configurado.
# Si DB_DATA_DIR está vacío no hay nada que migrar (ya se usa el volumen nombrado).
#
# Uso:
#   ./migrate-db-volume.sh                     # lee DB_DATA_DIR de .env
#   ./migrate-db-volume.sh --env-file envs/.env.dev

set -euo pipefail

# ── Leer archivo de entorno ────────────────────────────────────────────────────
ENV_FILE=".env"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file) ENV_FILE="$2"; shift 2 ;;
    *) echo "Argumento desconocido: $1" >&2; exit 1 ;;
  esac
done

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^\s*#' "$ENV_FILE" | grep -v '^\s*$' | xargs)
  echo "Usando variables de: $ENV_FILE"
else
  echo "Archivo de entorno no encontrado: $ENV_FILE" >&2
  exit 1
fi

# ── Si DB_DATA_DIR no está configurado no hay nada que hacer ─────────────────
if [[ -z "${DB_DATA_DIR:-}" ]]; then
  echo "DB_DATA_DIR no está configurado. Se usa el volumen Docker nombrado 'pgdata'."
  echo "No se requiere migración."
  exit 0
fi

# ── Variables ─────────────────────────────────────────────────────────────────
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-sistema-inventario}"
OLD_VOLUME="${PROJECT_NAME}_pgdata"
TARGET_DIR="$DB_DATA_DIR"

echo ""
echo "Volumen origen : $OLD_VOLUME"
echo "Directorio destino: $TARGET_DIR"
echo ""

# ── Verificar que el volumen origen existe ────────────────────────────────────
if ! docker volume inspect "$OLD_VOLUME" &>/dev/null; then
  echo "El volumen '$OLD_VOLUME' no existe. No hay datos que migrar."
  echo "El directorio '$TARGET_DIR' se inicializará vacío al primer arranque."
  exit 0
fi

# ── Verificar que el destino no tenga datos ya ───────────────────────────────
if [[ -d "$TARGET_DIR" ]] && [[ -n "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]]; then
  echo "El directorio '$TARGET_DIR' ya contiene datos. Migración omitida."
  exit 0
fi

# ── Crear directorio destino ──────────────────────────────────────────────────
mkdir -p "$TARGET_DIR"
ABS_TARGET="$(cd "$TARGET_DIR" && pwd)"

# ── Copiar datos usando un contenedor temporal ────────────────────────────────
echo "Copiando datos..."
docker run --rm \
  -v "${OLD_VOLUME}:/source:ro" \
  -v "${ABS_TARGET}:/target" \
  alpine sh -c "cp -a /source/. /target/ && echo 'Copia completada.'"

echo ""
echo "Migración exitosa."
echo "Los datos de PostgreSQL ahora están en: $TARGET_DIR"
echo ""
echo "Cuando confirmes que el sistema funciona puedes eliminar el volumen antiguo:"
echo "  docker volume rm $OLD_VOLUME"
