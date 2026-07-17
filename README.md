# Sistema de Inventario — Pruebas

Plataforma web para la gestión integral de inventario, productos y movimientos de stock. Arquitectura cliente-servidor: API REST en Java (Spring Boot) y frontend reactivo en Next.js.

---

## Tabla de contenido

- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Módulos del sistema](#módulos-del-sistema)
- [Despliegue con Docker](#despliegue-con-docker)
- [Perfiles de entorno (dev / testing / prod)](#perfiles-de-entorno-dev--testing--prod)
- [Despliegue local sin Docker](#despliegue-local-sin-docker)
- [Variables de entorno](#variables-de-entorno)
- [Referencia de la API](#referencia-de-la-api)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Solución de problemas](#solución-de-problemas)

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| **Backend** | Java + Spring Boot | 17 / 3.3 |
| **Persistencia** | Spring Data JPA + Hibernate | — |
| **Base de datos** | PostgreSQL | 14+ |
| **Build backend** | Apache Maven | 3.9+ |
| **Frontend** | Next.js + React | 15.1 / 19 |
| **Lenguaje frontend** | TypeScript | 5 |
| **Estado global** | Zustand | 5 |
| **Estilos** | Tailwind CSS | 3.4 |
| **Contenedores** | Docker + Docker Compose | — |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                      NAVEGADOR                          │
│   Next.js 15  (React 19 · TypeScript · Tailwind)        │
│   Inicio │ Productos │ Inventario │ Ventas │ Config      │
│                  HTTP/JSON → fetch API                  │
└───────────────────────┬─────────────────────────────────┘
                        │ REST  :8080
┌───────────────────────▼─────────────────────────────────┐
│              Spring Boot 3.3  (Java 17)                  │
│  Controllers → Services → Repositories (JPA)            │
└───────────────────────┬─────────────────────────────────┘
                        │ JDBC
┌───────────────────────▼─────────────────────────────────┐
│              PostgreSQL 14+                              │
│              Schema: sysinventarios                      │
└─────────────────────────────────────────────────────────┘
```

---

## Módulos del sistema

| Módulo | Descripción |
|---|---|
| **Inicio** | Pantalla de bienvenida con accesos directos a las acciones principales |
| **Productos** | Catálogo de referencias con búsqueda, filtros por columna y paginación |
| **Inventario** | Registro de artículos físicos: entrada, código de barras, precio, fechas |
| **Ventas** | Historial de retiros con métricas: stock, retirados, valor en stock y retirado |
| **Configuración** | IP de red local con generador de QR para acceso desde otros dispositivos |

---

## Despliegue con Docker

### Requisitos

- Docker Engine 24+
- Docker Compose v2

```bash
docker --version
docker compose version
```

### 1. Variables de entorno

No hace falta crear nada a mano: `start.bat` (Windows) / `start.sh` (Linux/macOS) crean
`.env` automáticamente a partir de `.env.example` (empaquetado en el repo con valores por
defecto) la primera vez que se ejecutan, y de paso detectan la IP WiFi del host para que
la app Android la use por defecto. Si prefieres personalizar algo (contraseñas, puertos,
etc.), edita `.env` después de la primera corrida, o créalo tú mismo antes:

```bash
cp .env.example .env
```

Para uso local los valores por defecto funcionan sin cambios.

> **`NEXT_PUBLIC_API_BASE_URL`** no se configura en `.env`: en el flujo Docker el
> navegador siempre llama al backend a través de `/api-proxy` (rewrite de Next.js
> definido en `next.config.ts`, ver `docker-compose.yml`), nunca de forma directa —
> así el acceso por LAN funciona sin importar desde qué IP se abra la app (ver QR
> de acceso en Configuración → Red local). Esta variable solo aplica al ejecutar
> el frontend **sin Docker** (`yarn dev`/`yarn build`) — ver
> [Despliegue local sin Docker](#despliegue-local-sin-docker).

### 2. Levantar el stack completo

```bash
start.bat up --build      # Windows
./start.sh up --build     # Linux / macOS
```

`start.bat`/`start.sh` crean `.env` si falta (ver paso 1), detectan la IP WiFi del host
para `HOST_IP` y luego llaman a `docker compose` pasándole los argumentos tal cual —
son un envoltorio, no un comando distinto. Si ya tienes `.env` armado a mano y no
necesitas la detección de IP, `docker compose up --build` funciona igual de bien.

Este único comando construye y arranca los servicios en orden:

```
db  →  backend  →  frontend
        └────────→  android  (compila el APK, no es un servidor)
```

La primera vez descarga dependencias de Maven, compila los assets de Next.js y compila el APK de Android (3–10 min según tu conexión — el APK en particular descarga el Android SDK completo la primera vez). Las siguientes ejecuciones usan caché de Docker y son mucho más rápidas.

### 3. Acceso a la aplicación

Una vez que los logs muestren:
```
backend   | Started InventoryApplication in X.XXX seconds
frontend  | ✓ Ready in XXXms
```

| Servicio | URL |
|---|---|
| **Frontend** | **http://localhost:3000** |
| **API REST** | http://localhost:8080/product |
| **Base de datos** | localhost:5432 |

### 4. App Android (APK)

El servicio `android` de `docker-compose.yml` compila el APK **completo dentro de Docker**
(JDK, Android SDK y Gradle quedan dentro del contenedor) — **no necesitas instalar Java,
Gradle ni Android Studio** en tu máquina para generarlo, ni para reconstruirlo tras un
cambio de código.

Al terminar `docker compose up --build`, el instalable queda en:

```
./apk/sistema-inventario.apk
```

Cópialo al celular (o compártelo por el servidor de archivos que prefieras) e instálalo
habilitando "Orígenes desconocidos". La app se conecta automáticamente al backend usando
la IP detectada por `start.bat`/`start.sh` (`HOST_IP` en `.env`); si cambia la IP del
servidor, usa el código QR de "Backend API" en la web (Configuración → Red local) para
reconfigurarla sin reinstalar.

Para recompilar solo el APK después de tocar código Android:

```bash
docker compose up --build android
```

### Otros comandos

```bash
# Levantar en segundo plano
docker compose up --build -d

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Detener (conserva los datos en el volumen pgdata)
docker compose down

# Detener y borrar todos los datos
docker compose down -v

# Reconstruir sin caché (necesario al cambiar variables NEXT_PUBLIC_*)
docker compose build --no-cache && docker compose up
```

### Puertos por defecto

| Servicio | Puerto host | Configurable en `.env` |
|---|---|---|
| Frontend (Next.js) | `3000` | `FRONTEND_PORT` |
| Backend (Spring Boot) | `8080` | `BACKEND_PORT` |
| Base de datos (PostgreSQL) | `5432` (solo dev/testing) | `DB_HOST_PORT` |

---

## Perfiles de entorno (dev / testing / prod)

El backend activa un perfil de Spring (`SPRING_PROFILES_ACTIVE`) que carga
`server/beta/src/main/resources/application-{perfil}.properties` encima de la
configuración base. Cada perfil tiene su propio archivo `.env.{perfil}` en la
raíz del proyecto con valores ya preparados:

| Perfil | `.env.*` | `ddl-auto` | Puerto de BD expuesto al host |
|---|---|---|---|
| **dev** | `.env.dev` | `update` (ajusta el esquema sin borrar datos) | Sí, opcional |
| **testing** | `.env.testing` | `create-drop` (esquema limpio en cada corrida) | Sí, opcional |
| **prod** | `.env.prod` | `validate` (nunca modifica el esquema) | No |

> ⚠️ `.env.testing` apunta **a propósito** a la misma base de datos que `.env.dev`.
> Como usa `create-drop`, cada arranque/parada de `testing` borra los datos de
> desarrollo. Si necesitas conservarlos, no uses el perfil testing sobre esa BD.

El proyecto no usa Flyway ni Liquibase: en `prod`, cualquier cambio de esquema
debe aplicarse manualmente o migrando temporalmente a `ddl-auto=update`.

### Levantar cada perfil

```bash
# Dev — con la base de datos expuesta en localhost:5432 para conectar un cliente (DBeaver, psql...)
docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.expose-db.yml up --build

# Testing — igual que dev, pero con esquema recreado en cada corrida (ver advertencia arriba)
docker compose --env-file .env.testing -f docker-compose.yml -f docker-compose.expose-db.yml up --build

# Prod — la base de datos NO se expone al host
docker compose --env-file .env.prod up --build
```

`docker-compose.expose-db.yml` es un override que solo agrega el mapeo de
puerto de PostgreSQL; nunca se incluye en el comando de `prod`, así que la
base de datos de producción queda accesible únicamente desde el backend,
dentro de la red interna de Docker.

Antes de desplegar `prod`, reemplaza todos los valores `CHANGE_ME` de
`.env.prod` (usuario/contraseña de BD, `JWT_SECRET`, `ADMIN_DEFAULT_PASSWORD`,
URL pública). No subas ese archivo a git con secretos reales — cópialo a
`./.env` (ya ignorado por git) y completa ahí los valores reales.

---

## Despliegue local sin Docker

### Backend

```bash
cd server/beta

# Compilar
mvn clean package -DskipTests

# Ejecutar
java -jar target/inventory-0.0.1-SNAPSHOT.jar
```

Edita `src/main/resources/application.properties` con los datos de tu BD local:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/mydatabase
spring.datasource.username=myuser
spring.datasource.password=mypassword
spring.jpa.properties.hibernate.default_schema=sysinventarios
```

Verifica que responde:
```bash
curl http://localhost:8080/product
```

### Frontend

```bash
cd web/beta

# Crear archivo de entorno
cp .env.local.example .env.local

# Instalar dependencias
yarn install

# Modo desarrollo
yarn dev
```

Accede en: **http://localhost:3000**. Variables de `web/beta/.env.local` — ver la sección **Frontend local** más abajo.

---

## Variables de entorno

### Docker — `.env` (raíz del proyecto)

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `DB_NAME` | Nombre de la base de datos | `inventory` |
| `DB_USER` | Usuario de PostgreSQL | `myuser` |
| `DB_PASSWORD` | Contraseña del usuario | `mypassword` |
| `DB_SCHEMA` | Schema donde Hibernate crea las tablas | `sysinventarios` |
| `SPRING_PROFILE` | Perfil activo del backend (`dev`\|`testing`\|`prod`) — controla `ddl-auto`, ver [Perfiles de entorno](#perfiles-de-entorno-dev--testing--prod) | `dev` |
| `DB_HOST_PORT` | Puerto del host para PostgreSQL (solo con `docker-compose.expose-db.yml`) | `5432` |
| `BACKEND_PORT` | Puerto del host para Spring Boot | `8080` |
| `FRONTEND_PORT` | Puerto del host para Next.js | `3000` |
| `NEXT_PUBLIC_SITE_TITLE` | Título de la aplicación (metadatos + header) | `Sistema Inventario` |
| `NEXT_PUBLIC_SITE_CLIENT` | Nombre del cliente en el header | `TuZona PC Gamer` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | Descripción usada en metadatos de la página | *(vacío)* |
| `JWT_SECRET` | Secreto para firmar los JWT de la app Android | `change-me-in-prod-please-32-bytes-min` |
| `JWT_EXPIRATION_MS` | Expiración del JWT en milisegundos | `86400000` |
| `ADMIN_DEFAULT_PASSWORD` | Contraseña del usuario `admin` sembrado al primer arranque | `admin123` |

> `NEXT_PUBLIC_API_BASE_URL` y `NEXT_PUBLIC_LOGO` **no** se configuran aquí — en
> el flujo Docker el navegador siempre usa `/api-proxy` (ver nota más arriba) y
> el logo se sirve dinámicamente desde el backend (Configuración → Logo). Ambas
> solo aplican al frontend sin Docker, ver la tabla siguiente.

### Frontend local — `web/beta/.env.local`

Copia `web/beta/.env.local.example` a `web/beta/.env.local` (ver [Despliegue local sin Docker](#despliegue-local-sin-docker)). Solo tiene efecto al correr `yarn dev`/`yarn build` fuera de Docker.

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | URL del backend accesible desde el navegador | `http://localhost:8080` |
| `NEXT_PUBLIC_SITE_TITLE` | Título de la aplicación | `Sistema Inventario` |
| `NEXT_PUBLIC_SITE_CLIENT` | Nombre del cliente en el header | `TuZona PC Gamer` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | Descripción usada en metadatos | *(vacío)* |
| `NEXT_PUBLIC_LOGO` | Ruta del logo por defecto si el backend no tiene uno configurado | `/logo/logo.png` |

---

## Referencia de la API

Base URL: `http://localhost:8080`

### Productos — `/product`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/product` | Listar todos los productos |
| `POST` | `/product/dto` | Crear o actualizar producto |
| `GET` | `/product/inventory/id/{id}` | Obtener producto por ID |
| `DELETE` | `/product/inventory/id/{id}` | Eliminar producto por ID |

```json
{ "id": 0, "name": "Mouse Gamer", "brand": "Logitech", "model": "MX Master 3S" }
```

### Inventario — `/inventory`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/inventory` | Listar todos los artículos |
| `POST` | `/inventory/dto` | Crear o actualizar artículo |
| `POST` | `/inventory/out` | Registrar retiro por código de barras |
| `GET` | `/inventory/inventory/id/{id}` | Obtener artículo por ID |
| `GET` | `/inventory/inventory/code/{code}` | Buscar por código de barras |
| `DELETE` | `/inventory/inventory/id/{id}` | Eliminar artículo por ID |

```json
{
  "id": 0,
  "barcode": "7501234567890",
  "quantity": 1,
  "price": 350000.00,
  "arrivalDate": "2026-06-11",
  "outDate": null,
  "product": { "id": 1, "name": "Mouse Gamer", "brand": "Logitech", "model": "MX Master 3S" }
}
```

Retiro:
```json
{ "barCode": "7501234567890", "dateOut": "2026-06-11" }
```

---

## Estructura del proyecto

```
Sistema_Inventario/
├── docker-compose.yml          # Un solo archivo: db + backend + frontend
├── init-db.sh                  # Crea el schema PostgreSQL al primer arranque
├── .env.example                # Plantilla de variables de entorno
│
├── server/beta/                # ── BACKEND (Spring Boot) ──────────────────
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/pruebas/
│       │   ├── controller/     # ProductController, InventoryController
│       │   ├── model/          # Product, InventoryItem
│       │   ├── dto/            # ProductDTO, InventoryDTO, WInventory
│       │   ├── service/        # Facades + implementaciones
│       │   └── repository/     # Spring Data JPA
│       └── resources/
│           └── application.properties
│
└── web/beta/                   # ── FRONTEND (Next.js) ──────────────────────
    ├── Dockerfile
    ├── package.json
    └── app/
        ├── page.tsx            # Enrutamiento por tabs
        ├── api/network-info/   # Endpoint: IP de red local y hostname
        ├── model/              # Tipos TypeScript
        ├── store/              # Zustand: productos, inventario, UI
        └── components/
            ├── base/           # Layout, Wellcome, Modal, Toast, Loader
            ├── product/        # Tabla + editor de productos
            ├── inventory/      # Tabla + editor de inventario
            ├── sales/          # Métricas + escáner QR/barras
            └── config/         # IP de red + generador de QR de acceso
```

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Connection refused` al arrancar el backend | DB no está lista | El healthcheck de Docker lo resuelve automáticamente; espera unos segundos |
| `schema "sysinventarios" does not exist` | Schema no creado | El `init-db.sh` lo crea al primer arranque del contenedor `db` |
| El frontend no conecta al backend | `INTERNAL_API_URL`/proxy mal configurado, o el backend no está sano | Revisa `docker compose logs backend` y que `depends_on: db` esté saludable; reconstruye con `docker compose build --no-cache` |
| El frontend local (`yarn dev`) no conecta al backend | `NEXT_PUBLIC_API_BASE_URL` incorrecto en `web/beta/.env.local` | Verifica el valor y reinicia `yarn dev` (se re-lee en cada arranque) |
| Error de CORS | Origen del frontend no permitido | Revisa `CorsConfig.java` |
| Puerto ocupado | Otro proceso usa el 3000 u 8080 | Cambia `FRONTEND_PORT` o `BACKEND_PORT` en `.env` |
| Código de barras duplicado | Artículo ya registrado | Usa un código diferente o edita el registro existente |

---

## Licencia

Uso interno — pruebas. Todos los derechos reservados.
