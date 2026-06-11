@echo off
REM Uso: run-compose.bat [dev|test|prod]
REM      Si no se pasa argumento se usa 'dev'.

set ENV=%1
if "%ENV%"=="" set ENV=dev

set ENV_FILE=envs\.env.%ENV%
set OVERRIDE=docker-compose.%ENV%.yml

if not exist "%ENV_FILE%" (
    if "%ENV%"=="prod" (
        echo ERROR: %ENV_FILE% no existe.
        echo Crea el archivo desde la plantilla:
        echo   copy envs\.env.prod.example envs\.env.prod
    ) else (
        echo ERROR: %ENV_FILE% no existe.
        echo Ambientes disponibles: dev ^| test ^| prod
    )
    exit /b 1
)

echo Iniciando ambiente: %ENV%
docker compose -f docker-compose.yml -f %OVERRIDE% --env-file %ENV_FILE% up --build
pause
