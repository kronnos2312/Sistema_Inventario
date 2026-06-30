#!/bin/bash

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
GRAY='\033[0;90m'
WHITE='\033[0;97m'
NC='\033[0m'

# ── Banner ────────────────────────────────────────────────────────────────────
printf "${CYAN}%s\n" ''
printf "${CYAN}%s\n" '  ____  ___ ____ _____ ___ __  __    _    '
printf "${CYAN}%s\n" ' / ___|_ _/ ___|_   _| __|  \/  |  / \   '
printf "${CYAN}%s\n" ' \___ \| |\___ \ | | | _|| |\/| | / _ \  '
printf "${CYAN}%s\n" '  ___) | | ___) || | | |__| |  | |/ ___ \ '
printf "${CYAN}%s\n" ' |____/___|____/ |_| |____|_|  |_/_/   \_\'
printf "${CYAN}%s\n" ''
printf "${CYAN}%s\n" '  ____  ___ '
printf "${CYAN}%s\n" ' |  _ \| __|'
printf "${CYAN}%s\n" ' | |_) |  _|'
printf "${CYAN}%s\n" ' |  _ <| |__'
printf "${CYAN}%s\n" ' |_| \_\____|'
printf "${CYAN}%s\n" ''
printf "${CYAN}%s\n" '  ___ _  _ _   _ ___ _  _ _____ _   ___ ___ ___  ___ '
printf "${CYAN}%s\n" ' |_ _| \| \ \ / / __| \| |_   _/_\ | _ \_ _/ _ \/ __|'
printf "${CYAN}%s\n" '  | || .`|\ V /| _|| .`| | |/ _ \|   /| | (_) \__ \'
printf "${CYAN}%s\n" ' |___|_|\_| \_/ |___|_|\_||_|/_/ \_\_|_\___\___/|___/'
printf "${GREEN}%s\n" ''
printf "${GREEN}%s\n" ' :: Sistema de Inventarios ::'
printf "${NC}%s\n"   ''

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
