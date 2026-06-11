@echo off
if not exist .env (
    echo No se encontro .env -- copiando desde .env.example...
    copy .env.example .env
    echo Revisa y ajusta .env antes de continuar si es necesario.
)
echo Iniciando Docker Compose (backend + frontend en contenedor unico)...
docker compose up --build
pause
