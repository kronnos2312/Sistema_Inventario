# Sistema de Inventario — Sistema_Inventario

Plataforma web para la gestión integral de inventario, productos y movimientos de stock. Arquitectura cliente-servidor desacoplada: API REST en Java y frontend reactivo en Next.js.

---

## Tabla de contenido

- [Descripción general](#descripción-general)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Módulos del sistema](#módulos-del-sistema)
- [Requisitos previos](#requisitos-previos)
- [Configuración de la base de datos](#configuración-de-la-base-de-datos)
- [Despliegue local — Backend](#despliegue-local--backend)
- [Despliegue local — Frontend](#despliegue-local--frontend)
- [Variables de entorno](#variables-de-entorno)
- [Ambientes (dev / test / prod)](#ambientes-dev--test--prod)
  - [Paso a paso — Desarrollo](#configuración-paso-a-paso--desarrollo-dev)
  - [Paso a paso — Pruebas](#configuración-paso-a-paso--pruebas-test)
  - [Paso a paso — Producción](#configuración-paso-a-paso--producción-prod)
- [Despliegue con Docker](#despliegue-con-docker)
- [Referencia de la API](#referencia-de-la-api)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Solución de problemas](#solución-de-problemas)

---

## Descripción general

El Sistema de Inventario permite a los operadores de TuZonaPCGamer registrar entradas y salidas de productos, gestionar el catálogo y consultar el historial de movimientos desde una interfaz web moderna. Las operaciones principales son:

- Crear, editar y eliminar **productos** del catálogo.
- Registrar **entradas de inventario** asociadas a productos con código de barras único.
- Registrar **retiros o salidas** de artículos del stock.
- Consultar el **historial de ventas y movimientos** con métricas en tiempo real.

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
| **Package manager** | Yarn | 1.22 |
| **Escáner QR/barras** | @zxing/browser | 0.1.5 |
| **Contenedores** | Docker + Docker Compose | — |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                      NAVEGADOR                          │
│                                                         │
│   Next.js 15  (React 19 · TypeScript · Tailwind)        │
│   ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐   │
│   │  Inicio  │ │ Productos │ │Inventario│ │Ventas  │   │
│   └──────────┘ └───────────┘ └──────────┘ └────────┘   │
│                                                         │
│   Estado global: Zustand stores                         │
│   HTTP / JSON  →  fetch API                             │
└───────────────────────┬─────────────────────────────────┘
                        │ REST  (puerto 8080)
┌───────────────────────▼─────────────────────────────────┐
│              Spring Boot 3.3  (Java 17)                  │
│                                                         │
│  Controllers → Services (Facade) → Repositories (JPA)   │
│                                                         │
└───────────────────────┬─────────────────────────────────┘
                        │ JDBC
┌───────────────────────▼─────────────────────────────────┐
│              PostgreSQL 14+                              │
│              Schema: sysinventarios                      │
│              Tablas: product · inventoryitem             │
└─────────────────────────────────────────────────────────┘
```

---

## Módulos del sistema

### Inicio
Pantalla de bienvenida con accesos directos a las cuatro acciones más frecuentes: registrar producto, registrar entrada, registrar retiro y ver ventas.

### Productos
Catálogo de referencias. Cada producto tiene nombre, marca y modelo. Soporta búsqueda global, filtros por columna, paginación y eliminación con confirmación.

### Inventario
Registro de artículos físicos. Cada artículo se asocia a un producto, tiene código de barras único, precio, cantidad, fecha de ingreso y, opcionalmente, fecha de salida. Incluye filtro por estado (En Stock / Retirado) con badges visuales.

### Ventas / Movimientos
Historial de retiros del inventario. Muestra métricas en tarjetas: artículos en stock, artículos retirados, valor en stock y valor retirado. Permite registrar nuevos retiros por código de barras.

---

## Requisitos previos

Instala las siguientes herramientas antes de continuar:

| Herramienta | Versión mínima | Enlace |
|---|---|---|
| Java JDK | 17 | https://adoptium.net |
| Apache Maven | 3.9 | https://maven.apache.org |
| Node.js | 18 LTS | https://nodejs.org |
| Yarn | 1.22 | `npm install -g yarn` |
| PostgreSQL | 14 | https://www.postgresql.org |
| Docker *(opcional)* | 24 | https://www.docker.com |

Verifica la instalación ejecutando:

```bash
java -version      # java version "17.x.x"
mvn -version       # Apache Maven 3.x.x
node -version      # v18.x.x o superior
yarn -version      # 1.22.x
psql --version     # psql (PostgreSQL) 14.x
```

---

## Configuración de la base de datos

### 1. Crear usuario y base de datos

Conéctate a PostgreSQL como superusuario y ejecuta:

```sql
-- Crear usuario de la aplicación
CREATE USER myuser WITH PASSWORD 'mypassword';

-- Crear base de datos
CREATE DATABASE mydatabase OWNER myuser;

-- Conectarse a la base de datos
\c mydatabase

-- Crear schema de la aplicación
CREATE SCHEMA sysinventarios AUTHORIZATION myuser;
```

> **Nota:** Hibernate crea las tablas automáticamente al iniciar el backend (`ddl-auto=update`). No es necesario ejecutar scripts SQL adicionales.

### 2. Verificar la conexión

```bash
psql -U myuser -d mydatabase -h localhost -p 5432
```

---

## Despliegue local — Backend

### 1. Ingresar al directorio del backend

```bash
cd Sistema_Inventario/server/beta
```

### 2. Configurar la conexión a la base de datos

Edita `src/main/resources/application.properties` con los datos de tu entorno:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/mydatabase
spring.datasource.username=myuser
spring.datasource.password=mypassword
spring.jpa.properties.hibernate.default_schema=sysinventarios
```

### 3. Compilar y ejecutar

```bash
# Compilar omitiendo tests en el primer arranque
mvn clean package -DskipTests

# Ejecutar directamente con Maven
mvn spring-boot:run
```

O ejecutar el JAR generado:

```bash
java -jar target/inventory-0.0.1-SNAPSHOT.jar
```

En Windows también puedes usar el wrapper incluido:

```cmd
mvnw.cmd spring-boot:run
```

### 4. Verificar que el backend responde

```
GET http://localhost:8080/product
```

Debe devolver un array JSON (vacío `[]` si no hay datos aún).

---

## Despliegue local — Frontend

### 1. Ingresar al directorio del frontend

```bash
cd Sistema_Inventario/web/beta
```

### 2. Crear el archivo de variables de entorno

Crea el archivo `.env.local` en la raíz de `web/beta/` con el siguiente contenido:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_SITE_TITLE=Sistema de Inventario
NEXT_PUBLIC_SITE_CLIENT=TuZonaPCGamer
NEXT_PUBLIC_LOGO=/img/logo.png
```

> Consulta la sección [Variables de entorno](#variables-de-entorno) para la descripción completa.

### 3. Instalar dependencias

```bash
yarn install
```

### 4. Ejecutar en modo desarrollo

```bash
yarn dev
```

Accede a la aplicación en: **http://localhost:3000**

### 5. Build de producción

```bash
yarn build
yarn start
```

---

## Variables de entorno

### Docker — archivo `.env` (raíz del proyecto)

Al usar Docker Compose todas las variables se centralizan en el archivo `.env` de la raíz. Copia `.env.example` como punto de partida.

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `DB_NAME` | Nombre de la base de datos PostgreSQL | `mydatabase` |
| `DB_USER` | Usuario de PostgreSQL | `myuser` |
| `DB_PASSWORD` | Contraseña del usuario | `mypassword` |
| `DB_SCHEMA` | Schema donde se crean las tablas | `sysinventarios` |
| `DDL_AUTO` | Estrategia DDL de Hibernate | `update` |
| `NEXT_PUBLIC_API_BASE_URL` | URL del backend accesible desde el navegador | `http://localhost:8080` |
| `NEXT_PUBLIC_SITE_TITLE` | Título de la aplicación | `TuZonaPCGamer` |
| `NEXT_PUBLIC_SITE_CLIENT` | Nombre del cliente en la pantalla de inicio | `TuZona PC Gamer` |
| `NEXT_PUBLIC_LOGO` | Ruta pública del logotipo | `/img/Testing_LOGO.png` |
| `FRONTEND_PORT` | Puerto del host para el frontend | `3000` |
| `BACKEND_PORT` | Puerto del host para el backend | `8080` |
| `DB_HOST_PORT` | Puerto del host para PostgreSQL | `5432` |

### Backend — `application.properties` (desarrollo local sin Docker)

| Propiedad | Descripción | Valor por defecto |
|---|---|---|
| `spring.datasource.url` | URL JDBC de PostgreSQL | `jdbc:postgresql://localhost:5432/mydatabase` |
| `spring.datasource.username` | Usuario de la base de datos | `myuser` |
| `spring.datasource.password` | Contraseña del usuario | `mypassword` |
| `spring.jpa.properties.hibernate.default_schema` | Schema de trabajo | `sysinventarios` |
| `spring.jpa.hibernate.ddl-auto` | Estrategia DDL de Hibernate | `update` |
| `spring.jpa.show-sql` | Mostrar SQL generado en consola | `true` |

Las propiedades también se pueden sobreescribir con variables de entorno del sistema (Spring Boot las mapea automáticamente):

```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/mydatabase
export SPRING_DATASOURCE_USERNAME=myuser
export SPRING_DATASOURCE_PASSWORD=mypassword
```

### Frontend — `.env.local` (desarrollo local sin Docker)

Todas las variables deben comenzar con `NEXT_PUBLIC_` para ser accesibles desde el navegador.

| Variable | Descripción | Requerida |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | URL base del backend REST, sin barra final | Sí |
| `NEXT_PUBLIC_SITE_TITLE` | Título de la aplicación (header y pestaña del navegador) | No |
| `NEXT_PUBLIC_SITE_CLIENT` | Nombre del cliente mostrado en la pantalla de inicio | No |
| `NEXT_PUBLIC_LOGO` | Ruta pública del logotipo, relativa a `/public` | No |

---

## Ambientes (dev / test / prod)

El proyecto usa un `docker-compose.yml` base más un archivo de override por ambiente. Cada ambiente tiene su propio namespace de volúmenes (vía `COMPOSE_PROJECT_NAME`), por lo que pueden coexistir en el mismo host.

```
docker-compose.yml            ← base común (no usar solo)
docker-compose.dev.yml        ← overrides de desarrollo
docker-compose.test.yml       ← overrides de pruebas
docker-compose.prod.yml       ← overrides de producción

envs/
  .env.dev                    ← variables de dev (commiteado)
  .env.test                   ← variables de test (commiteado)
  .env.prod.example           ← plantilla de prod (commiteado)
  .env.prod                   ← credenciales reales de prod (gitignored)
```

### Diferencias por ambiente

| Característica | dev | test | prod |
|---|---|---|---|
| `ddl-auto` | `update` | `create-drop` | `update` |
| Schema BD | `sysinventarios` | `sysinventarios_test` | `sysinventarios` |
| BD expuesta al host | Sí (`:5433`) | Sí (`:5434`) | No |
| SQL en consola | Sí (DEBUG) | Sí (DEBUG) | No (WARN) |
| Restart policy | `no` | `no` | `always` |
| Límites de recursos | No | No | CPU 2 / RAM 1.5 GB |
| Modo foreground | Sí | Sí | No (`-d`) |

---

### Configuración paso a paso — Desarrollo (dev)

El ambiente de desarrollo expone todos los puertos, activa el log SQL completo y no reinicia los contenedores automáticamente para facilitar el ciclo editar → probar → detener.

**Requisitos:** Docker Desktop o Docker Engine + Docker Compose v2.

#### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd Sistema_Inventario
```

#### 2. Revisar las variables de dev

Abre `envs/.env.dev` y confirma los valores. Para un entorno local estándar no hace falta cambiar nada:

```env
DB_NAME=inventory_dev       # BD separada de prod
DB_USER=myuser
DB_PASSWORD=mypassword
DB_SCHEMA=sysinventarios
DB_HOST_PORT=5433           # ← puerto 5433 para no chocar con PostgreSQL local
DDL_AUTO=update

NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
FRONTEND_PORT=3000
BACKEND_PORT=8080
```

> Si ya tienes PostgreSQL corriendo en el host en el puerto 5432, el puerto `5433` evita el conflicto. Si el 5433 también está ocupado, cambia `DB_HOST_PORT` a cualquier puerto libre.

#### 3. Levantar el stack

Linux / Mac / WSL:
```bash
make dev
```

Windows CMD:
```bat
run-compose.bat dev
```

Docker Compose directo:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml \
  --env-file envs/.env.dev up --build
```

La primera vez Maven descarga dependencias y npm compila los assets — puede tardar 3-5 minutos. Las siguientes ejecuciones usan la caché de Docker y son mucho más rápidas.

#### 4. Verificar que levantó correctamente

Cuando veas en los logs la línea:

```
backend  | Started InventoryApplication in X.XXX seconds
frontend | ✓ Ready in XXXms
```

Ambos procesos están listos. Comprueba:

```bash
# BD accesible desde el host
psql -U myuser -d inventory_dev -h localhost -p 5433

# API REST
curl http://localhost:8080/product

# Frontend
# Abre en el navegador: http://localhost:3000
```

#### 5. Ver logs mientras desarrollas

```bash
# En otra terminal
docker compose -f docker-compose.yml -f docker-compose.dev.yml \
  --env-file envs/.env.dev logs -f app
```

#### 6. Detener

```bash
make down-dev
# o
docker compose -f docker-compose.yml -f docker-compose.dev.yml \
  --env-file envs/.env.dev down
```

Los datos de la BD persisten en el volumen `inv-dev_pgdata`. Para borrarlos también:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml \
  --env-file envs/.env.dev down -v
```

---

### Configuración paso a paso — Pruebas (test)

El ambiente de pruebas usa `ddl-auto=create-drop` (la BD se crea limpia al arrancar y se destruye al bajar) y un schema aislado. Puede correr en paralelo con dev porque usa puertos diferentes para la BD.

#### 1. Revisar las variables de test

Abre `envs/.env.test` y confirma:

```env
DB_NAME=inventory_test
DB_USER=testuser
DB_PASSWORD=testpassword
DB_SCHEMA=sysinventarios_test   # schema aislado
DB_HOST_PORT=5434               # puerto distinto al de dev (5433) y al local (5432)
DDL_AUTO=create-drop            # ← BD limpia en cada arranque

NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
FRONTEND_PORT=3000
BACKEND_PORT=8080
```

#### 2. Levantar el stack de test

```bash
make test
# o
docker compose -f docker-compose.yml -f docker-compose.test.yml \
  --env-file envs/.env.test up --build
```

Con `create-drop`, Hibernate crea todas las tablas al iniciar y las elimina al apagar. El volumen de datos queda vacío entre ejecuciones.

#### 3. Verificar el arranque

Espera el mensaje `Started InventoryApplication` en los logs y comprueba:

```bash
# BD de test accesible
psql -U testuser -d inventory_test -h localhost -p 5434

# API apuntando al schema correcto
curl http://localhost:8080/product    # debe devolver []
```

#### 4. Detener y limpiar (obligatorio)

Siempre baja el ambiente de test eliminando el volumen para garantizar una BD limpia en la próxima ejecución:

```bash
make down-test
# equivale a:
docker compose -f docker-compose.yml -f docker-compose.test.yml \
  --env-file envs/.env.test down -v
```

> **Importante:** omitir `-v` deja el volumen con datos de la ejecución anterior. La próxima vez, `create-drop` borrará y recreará las tablas, pero el volumen persistirá hasta que se elimine explícitamente.

---

### Configuración paso a paso — Producción (prod)

El ambiente de producción levanta los contenedores en segundo plano (`-d`), no expone la BD al host, silencia el log SQL y aplica límites de CPU y memoria.

> Estos pasos se ejecutan en el **servidor de producción**, no en la máquina de desarrollo.

#### 1. Clonar el repositorio en el servidor

```bash
git clone <url-del-repositorio>
cd Sistema_Inventario
```

#### 2. Crear el archivo de variables de producción

```bash
cp envs/.env.prod.example envs/.env.prod
```

#### 3. Editar `.env.prod` con las credenciales reales

```bash
nano envs/.env.prod   # o el editor de tu preferencia
```

Campos obligatorios a cambiar:

| Variable | Qué poner |
|---|---|
| `DB_PASSWORD` | Contraseña segura (mín. 16 caracteres, caracteres especiales) |
| `DB_USER` | Usuario de BD (evitar `myuser` en prod) |
| `DB_NAME` | Nombre de la BD de producción |
| `NEXT_PUBLIC_API_BASE_URL` | `http://<IP-o-dominio-del-servidor>:8080` |

Ejemplo de `.env.prod` completo:

```env
COMPOSE_PROJECT_NAME=inv-prod

DB_NAME=inventory_prod
DB_USER=inv_prod_user
DB_PASSWORD=S3cur3P@ssw0rd!2026
DB_SCHEMA=sysinventarios
DDL_AUTO=update

NEXT_PUBLIC_API_BASE_URL=http://192.168.1.100:8080
NEXT_PUBLIC_SITE_TITLE=TuZonaPCGamer
NEXT_PUBLIC_SITE_CLIENT=TuZona PC Gamer
NEXT_PUBLIC_LOGO=/img/Testing_LOGO.png

FRONTEND_PORT=3000
BACKEND_PORT=8080
```

> `NEXT_PUBLIC_API_BASE_URL` debe ser la URL que el **navegador del usuario** puede alcanzar. Si el servidor tiene dominio, usa `http://tudominio.com:8080`. Si solo tiene IP privada dentro de la red, usa la IP privada.

#### 4. Construir y levantar en segundo plano

```bash
make prod
# o
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file envs/.env.prod up --build -d
```

El flag `-d` (detach) hace que los contenedores corran en segundo plano y el terminal quede libre.

#### 5. Verificar el estado de los contenedores

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file envs/.env.prod ps
```

Ambos deben mostrar `running (healthy)` para `db` y `running` para `app`.

#### 6. Seguir los logs de arranque

```bash
make logs-prod
# o
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file envs/.env.prod logs -f
```

Presiona `Ctrl+C` para salir de los logs sin detener los contenedores.

#### 7. Verificar que la aplicación responde

```bash
# Desde el servidor
curl http://localhost:8080/product     # API
curl -I http://localhost:3000          # Frontend (debe devolver HTTP 200)

# Desde un navegador en la red
# http://<IP-del-servidor>:3000
```

#### 8. Detener producción

```bash
make down-prod
# o
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file envs/.env.prod down
```

> **No uses `down -v` en producción** a menos que quieras borrar todos los datos. Los datos persisten en el volumen `inv-prod_pgdata`.

---

### Referencia rápida de comandos

| Acción | Linux/Mac/WSL | Windows |
|---|---|---|
| Levantar dev | `make dev` | `run-compose.bat dev` |
| Levantar test | `make test` | `run-compose.bat test` |
| Levantar prod | `make prod` | `run-compose.bat prod` |
| Detener dev | `make down-dev` | `docker compose ... down` |
| Detener test + limpiar BD | `make down-test` | `docker compose ... down -v` |
| Detener prod | `make down-prod` | `docker compose ... down` |
| Logs dev | `make logs-dev` | `docker compose ... logs -f` |
| Logs prod | `make logs-prod` | `docker compose ... logs -f` |
| Limpiar dev + test | `make clean` | — |
| Ver todos los comandos | `make help` | — |

---

## Despliegue con Docker

El proyecto incluye un `Dockerfile` multi-stage en la raíz que compila el backend (Spring Boot) y el frontend (Next.js) en una **sola imagen**. Docker Compose orquesta esa imagen junto con PostgreSQL.

### Arquitectura del contenedor

```
┌─────────────────── tuzonapcgamer-db ───────────────────┐
│  PostgreSQL 14                                          │
│  Schema creado por init-db.sh (parametrizable con env) │
└───────────────────────────┬─────────────────────────────┘
                            │ JDBC (red interna app-net)
┌───────────────────────────▼─────────────────────────────┐
│              tuzonapcgamer-app                          │
│                                                         │
│  supervisord                                            │
│  ├── java -jar backend.jar   → :8080 (API REST)         │
│  └── npm start               → :3000 (Next.js)          │
└─────────────────────────────────────────────────────────┘
```

### Paso 1 — Requisitos

- Docker Engine 24+
- Docker Compose v2 (incluido en Docker Desktop)

Verifica:

```bash
docker --version
docker compose version
```

### Paso 2 — Crear el archivo de variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con los valores de tu entorno. Las variables disponibles son:

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `DB_NAME` | Nombre de la base de datos | `mydatabase` |
| `DB_USER` | Usuario de PostgreSQL | `myuser` |
| `DB_PASSWORD` | Contraseña del usuario | `mypassword` |
| `DB_SCHEMA` | Schema donde Hibernate crea las tablas | `sysinventarios` |
| `DDL_AUTO` | Estrategia DDL de Hibernate | `update` |
| `NEXT_PUBLIC_API_BASE_URL` | URL del backend accesible desde el navegador | `http://localhost:8080` |
| `NEXT_PUBLIC_SITE_TITLE` | Título de la aplicación | `TuZonaPCGamer` |
| `NEXT_PUBLIC_SITE_CLIENT` | Nombre del cliente en la pantalla de inicio | `TuZona PC Gamer` |
| `NEXT_PUBLIC_LOGO` | Ruta pública del logotipo | `/img/Testing_LOGO.png` |
| `FRONTEND_PORT` | Puerto del host para Next.js | `3000` |
| `BACKEND_PORT` | Puerto del host para Spring Boot | `8080` |
| `DB_HOST_PORT` | Puerto del host para PostgreSQL | `5432` |

> **Nota sobre `NEXT_PUBLIC_API_BASE_URL`:** Next.js incrusta esta URL en el bundle en tiempo de compilación. Si despliegas en un servidor remoto, cambia el valor al dominio o IP pública del servidor antes de construir la imagen (p. ej. `http://mi-servidor.com:8080`).

### Paso 3 — Construir y levantar el stack

```bash
# Construye la imagen y levanta los contenedores
docker compose up --build

# O en segundo plano
docker compose up -d --build
```

La primera vez tarda varios minutos (Maven descarga dependencias y Next.js compila los assets). Las siguientes ejecuciones usan la caché de Docker.

### Paso 4 — Verificar que todo está corriendo

```bash
docker compose ps
```

Deberías ver dos contenedores en estado `running`:

```
NAME                    STATUS
tuzonapcgamer-db        running (healthy)
tuzonapcgamer-app       running
```

Accede a:
- **Frontend:** http://localhost:3000
- **API REST:** http://localhost:8080/product

### Paso 5 — Ver logs

```bash
# Todos los servicios
docker compose logs -f

# Solo la aplicación
docker compose logs -f app

# Solo la base de datos
docker compose logs -f db
```

### Paso 6 — Detener el stack

```bash
# Detiene y elimina los contenedores (los datos persisten en el volumen pgdata)
docker compose down

# Detiene y elimina también los volúmenes (borra todos los datos)
docker compose down -v
```

### Reconstruir sin caché

Necesario cuando cambias variables `NEXT_PUBLIC_*` o el código fuente:

```bash
docker compose build --no-cache
docker compose up
```

### Puertos expuestos por defecto

| Contenedor | Puerto host | Puerto interno | Descripción |
|---|---|---|---|
| `tuzonapcgamer-app` | `3000` | `3000` | Next.js (frontend) |
| `tuzonapcgamer-app` | `8080` | `8080` | Spring Boot (API REST) |
| `tuzonapcgamer-db` | `5432` | `5432` | PostgreSQL |

Todos los puertos del host son configurables en `.env` (`FRONTEND_PORT`, `BACKEND_PORT`, `DB_HOST_PORT`).

---

## Referencia de la API

Base URL: `http://localhost:8080`

CORS habilitado para: `http://localhost:3000`

---

### Productos — `/product`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/product` | Listar todos los productos |
| `POST` | `/product/dto` | Crear o actualizar un producto |
| `GET` | `/product/inventory/id/{id}` | Obtener producto por ID |
| `DELETE` | `/product/inventory/id/{id}` | Eliminar producto por ID |

**Body — Crear/actualizar producto:**

```json
{
  "id": 0,
  "name": "Mouse Gamer",
  "brand": "Logitech",
  "model": "MX Master 3S"
}
```

> Si `id` es `0` o nulo, se crea un nuevo registro. Si tiene valor, se actualiza el existente.

---

### Inventario — `/inventory`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/inventory` | Listar todos los artículos |
| `POST` | `/inventory/dto` | Crear o actualizar artículo (valida código único) |
| `POST` | `/inventory/out` | Registrar retiro por código de barras |
| `GET` | `/inventory/inventory/id/{id}` | Obtener artículo por ID |
| `GET` | `/inventory/inventory/code/{code}` | Buscar artículo por código de barras |
| `GET` | `/inventory/inventory/entry/{date}` | Buscar artículos por fecha de ingreso |
| `DELETE` | `/inventory/inventory/id/{id}` | Eliminar artículo por ID |

**Body — Registrar entrada de inventario:**

```json
{
  "id": 0,
  "barcode": "7501234567890",
  "quantity": 1,
  "price": 350000.00,
  "description": "Caja sellada, garantía 1 año",
  "arrivalDate": "2026-05-31",
  "outDate": null,
  "product": {
    "id": 0,
    "name": "Mouse Gamer",
    "brand": "Logitech",
    "model": "MX Master 3S"
  }
}
```

**Body — Registrar retiro/salida:**

```json
{
  "barCode": "7501234567890",
  "dateOut": "2026-05-31"
}
```

**Formato de respuesta (operaciones de escritura):**

```json
{
  "codeName": "success",
  "messageName": "Operación completada correctamente"
}
```

```json
{
  "codeName": "error",
  "messageName": "El código de barras ya está registrado"
}
```

---

## Estructura del proyecto

```
Sistema_Inventario/
│
├── Dockerfile                      # Multi-stage: compila backend + frontend en una imagen
├── supervisord.conf                # Gestiona ambos procesos dentro del contenedor
├── docker-compose.yml              # Orquestación: servicio db + servicio app (único)
├── init-db.sh                      # Crea el schema PostgreSQL al iniciar (usa $DB_SCHEMA)
├── .env.example                    # Plantilla de variables de entorno
├── run-compose.bat                 # Atajo de arranque (Windows)
├── run-compose.sh                  # Atajo de arranque (Linux/Mac)
│
├── server/beta/                    # ── BACKEND (Spring Boot) ──────────────
│   ├── pom.xml                     # Dependencias Maven
│   └── src/main/
│       ├── java/com/tuzonapcgamer/
│       │   ├── InventoryApplication.java   # Punto de entrada
│       │   ├── CorsConfig.java             # Configuración CORS
│       │   ├── controller/
│       │   │   ├── ProductController.java
│       │   │   └── InventoryController.java
│       │   ├── model/
│       │   │   ├── BaseEntity.java         # Campos de auditoría comunes
│       │   │   ├── Product.java
│       │   │   └── InventoryItem.java
│       │   ├── dto/
│       │   │   ├── ProductDTO.java
│       │   │   ├── InventoryDTO.java
│       │   │   └── WInventory.java         # DTO para retiros
│       │   ├── service/
│       │   │   ├── facade/                 # Interfaces de servicio
│       │   │   └── implement/              # Implementaciones
│       │   └── repository/                 # Repositorios Spring Data JPA
│       └── resources/
│           └── application.properties      # Configuración de BD y JPA
│
└── web/beta/                       # ── FRONTEND (Next.js) ─────────────────
    ├── .env.local                  # Variables de entorno (crear manualmente)
    ├── package.json
    ├── next.config.ts
    ├── tailwind.config.ts
    └── app/
        ├── page.tsx                # Punto de entrada y enrutamiento por tabs
        ├── layout.tsx              # Layout raíz de Next.js
        │
        ├── model/                  # Tipos TypeScript
        │   ├── Product.ts
        │   ├── InventoryItem.ts
        │   └── WithdrawInventory.ts
        │
        ├── store/                  # Estado global con Zustand
        │   ├── userProductStore.ts     # CRUD productos
        │   ├── useInventoryStore.ts    # CRUD inventario + retiros
        │   ├── useToastStore.ts        # Notificaciones
        │   └── useLoaderStore.ts       # Indicador de carga
        │
        └── components/
            ├── base/               # Componentes compartidos
            │   ├── Layout.tsx          # Navbar + tabs de navegación
            │   ├── Wellcome.tsx        # Pantalla de inicio
            │   ├── UserDropdown.tsx
            │   └── context/
            │       ├── Modal.tsx           # Modal arrastrable y reusable
            │       ├── Toast.tsx           # Notificaciones temporales
            │       ├── Loader.tsx          # Overlay de carga
            │       └── ConfirmDialog.tsx   # Diálogo de confirmación
            │
            ├── product/            # Módulo Productos
            │   ├── ProductsPage.tsx
            │   ├── ProductTable.tsx        # Tabla con filtros y paginación
            │   └── editor/Product.tsx      # Formulario crear/editar
            │
            ├── inventory/          # Módulo Inventario
            │   ├── InventoryPage.tsx
            │   ├── InventoryTable.tsx      # Tabla con filtros y badges de estado
            │   └── editor/Inventory.tsx    # Formulario crear/editar
            │
            └── sales/              # Módulo Ventas / Movimientos
                ├── SalesPage.tsx           # Métricas + historial de retiros
                ├── ManualInventory.tsx     # Formulario de retiro por código
                └── BarcodeScanner.tsx      # Lector de QR/barras con cámara
```

---

## Flujo de datos

```
ENTRADA DE INVENTARIO
─────────────────────
Usuario completa el formulario (InventoryEditor)
  → POST /inventory/dto  con el DTO del artículo
  → Backend valida que el código de barras sea único
  → Hibernate persiste el registro en PostgreSQL
  → Zustand actualiza la lista local
  → Toast de confirmación al usuario
  → Modal se cierra automáticamente

RETIRO / SALIDA
───────────────
Usuario ingresa código de barras y fecha (ManualInventory)
  → POST /inventory/out  { barCode, dateOut }
  → Backend localiza el artículo por código
  → Registra outDate en el artículo
  → Zustand actualiza la lista
  → Módulo Ventas refleja el nuevo movimiento en métricas y tabla
```

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Connection refused` al arrancar el backend | PostgreSQL no está corriendo | Inicia el servicio PostgreSQL |
| `schema "sysinventarios" does not exist` | El schema no fue creado | Ejecuta `CREATE SCHEMA sysinventarios AUTHORIZATION myuser;` |
| El frontend no conecta al backend | URL incorrecta en `.env.local` | Verifica `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080` |
| Error de CORS en el navegador | El origen del frontend no está permitido | Revisa `CorsConfig.java` y añade el origen del frontend |
| `yarn: command not found` | Yarn no instalado globalmente | Ejecuta `npm install -g yarn` |
| Puerto 8080 ya en uso | Otro proceso ocupa el puerto | Añade `server.port=8081` en `application.properties` |
| Puerto 3000 ya en uso | Otro proceso ocupa el puerto | Next.js intentará el 3001 automáticamente |
| `ddl-auto=update` no crea las tablas | El usuario no tiene permisos sobre el schema | Otorga permisos: `GRANT ALL ON SCHEMA sysinventarios TO myuser;` |
| Código de barras duplicado | El artículo ya fue registrado | Usa un código diferente o edita el registro existente |

---

## Licencia

Uso interno — TuZonaPCGamer. Todos los derechos reservados.
