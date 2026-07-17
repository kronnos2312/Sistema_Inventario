@echo off
setlocal

:: ── Versión ──────────────────────────────────────────────────────────────────
set "APP_VERSION=dev"
if exist "VERSION" (
    set /p APP_VERSION=<VERSION
)

:: ── Banner ───────────────────────────────────────────────────────────────────
:: Texto plano (sin arte ASCII grande ni comandos PowerShell largos): se lee
:: correctamente en cualquier consola, incluida cmd.exe clásica.
echo.
echo ============================================
echo   Sistema de Inventarios  -  v%APP_VERSION%
echo ============================================
echo.

:: ── Crear .env desde .env.example si no existe ──────────────────────────────
:: Los valores por defecto quedan empaquetados en el repo (.env.example); así el
:: primer arranque no requiere que el cliente cree/edite nada a mano.
if not exist ".env" (
    if exist ".env.example" (
        copy /Y ".env.example" ".env" >nul
        echo [start] .env creado desde .env.example con valores por defecto.
    )
)

:: ── Detección de IP WiFi ────────────────────────────────────────────────────
for /f "usebackq tokens=*" %%a in (`powershell -NoProfile -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.PrefixOrigin -eq 'Dhcp' -and $_.InterfaceAlias -match 'Wi.Fi|WLAN|Wireless' -and $_.IPAddress -notmatch '^(127\.|169\.254\.)' } | Select-Object -First 1).IPAddress; if ($ip) { $ip } else { '' }"`) do set HOST_IP=%%a

:: ── Persistencia de HOST_IP en .env ─────────────────────────────────────────
:: Un contenedor Docker no puede ver el adaptador WiFi real del host, así que la
:: IP se detecta aquí (en Windows) y se guarda en .env. Así, cualquier
:: "docker compose up" posterior (sin pasar por este script) la recoge también,
:: porque Compose siempre carga .env automáticamente.
powershell -NoProfile -Command "$line = 'HOST_IP=' + $env:HOST_IP; if (Test-Path '.env') { $content = @(Get-Content '.env'); if ($content -match '^HOST_IP=') { $content = $content -replace '^HOST_IP=.*', $line } else { $content += $line }; Set-Content -Path '.env' -Value $content } else { Set-Content -Path '.env' -Value $line }"

:: ── Propiedades de despliegue ────────────────────────────────────────────────
powershell -NoProfile -Command "$sep = ' ' + ('-' * 54); Write-Host ' Propiedades de despliegue (.env)' -ForegroundColor Yellow; Write-Host $sep -ForegroundColor DarkGray; if (Test-Path '.env') { Get-Content '.env' | Where-Object { $_ -match '^\s*[A-Z][A-Z0-9_]*=' } | ForEach-Object { $p = $_ -split '=', 2; $k = $p[0].Trim(); $v = if ($k -match 'PASSWORD|SECRET') { '*****' } else { $p[1].Trim() }; Write-Host ('  {0,-26} {1}' -f $k, $v) -ForegroundColor White } }; $hip = $env:HOST_IP; $hv = if ($hip) { $hip + '  (detectada)' } else { 'ERROR: no se detecto IP de WiFi' }; $hc = if ($hip) { 'Green' } else { 'Red' }; Write-Host ('  {0,-26} {1}' -f 'HOST_IP', $hv) -ForegroundColor $hc; Write-Host $sep -ForegroundColor DarkGray; Write-Host ''"

:: ── Arranque ─────────────────────────────────────────────────────────────────
docker compose %*
