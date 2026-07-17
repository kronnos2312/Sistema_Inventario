#!/bin/bash

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
GRAY='\033[0;90m'
WHITE='\033[0;97m'
NC='\033[0m'

# ── Versión ──────────────────────────────────────────────────────────────────
APP_VERSION="dev"
if [ -f "VERSION" ]; then
  APP_VERSION=$(tr -d '[:space:]' < VERSION)
fi

# ── Banner ────────────────────────────────────────────────────────────────────
# Texto plano (sin arte ASCII grande): se lee correctamente en cualquier terminal.
printf '\n'
printf "${CYAN}%s\n${NC}" '============================================'
printf "${CYAN}%s${NC}${GREEN}%s\n${NC}" '  Sistema de Inventarios  -  v' "$APP_VERSION"
printf "${CYAN}%s\n${NC}" '============================================'
printf '\n'

# ── Crear .env desde .env.example si no existe ─────────────────────────────────
# Los valores por defecto quedan empaquetados en el repo (.env.example); así el
# primer arranque no requiere que el cliente cree/edite nada a mano.
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp ".env.example" ".env"
  printf "${GREEN}%s\n${NC}" "[start] .env creado desde .env.example con valores por defecto."
fi

# ── Detección de IP WiFi ──────────────────────────────────────────────────────
HOST_IP=$(ip -4 route get 8.8.8.8 2>/dev/null | grep -oP 'src \K[\d.]+' | head -1)
if [ -z "$HOST_IP" ]; then
  HOST_IP=$(ip -4 addr show 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | \
    grep -v '^127\.' | grep -v '^172\.' | head -1)
fi

# ── Propiedades de despliegue ─────────────────────────────────────────────────
SEP=" $(printf '%.0s-' {1..54})"
printf "${YELLOW}%s\n${NC}" ' Propiedades de despliegue (.env)'
printf "${GRAY}%s\n${NC}"   "$SEP"

if [ -f ".env" ]; then
  while IFS= read -r line; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line//[[:space:]]/}" ]] && continue
    [[ ! "$line" =~ ^[A-Z] ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    if echo "$key" | grep -qiE 'PASSWORD|SECRET'; then
      val='*****'
    fi
    printf "${WHITE}  %-26s %s\n${NC}" "$key" "$val"
  done < ".env"
fi

if [ -n "$HOST_IP" ]; then
  printf "${GREEN}  %-26s %s\n${NC}" "HOST_IP" "$HOST_IP  (detectada)"
else
  printf "${GRAY}  %-26s %s\n${NC}" "HOST_IP" "no detectada"
fi

printf "${GRAY}%s\n${NC}" "$SEP"
printf '%s\n' ''

# ── Arranque ──────────────────────────────────────────────────────────────────
export HOST_IP
docker compose "$@"
