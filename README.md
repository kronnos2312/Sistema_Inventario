# Sistema de Inventario — TuZonaPCGamer

Plataforma web para la gestión integral de inventario, productos y movimientos de stock. Arquitectura cliente-servidor: API REST en Java (Spring Boot) y frontend reactivo en Next.js.

---

## Tabla de contenido

- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Módulos del sistema](#módulos-del-sistema)
- [Despliegue con Docker](#despliegue-con-docker)
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

### 1. Crear el archivo de variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con los valores de tu entorno. Para uso local los valores por defecto funcionan sin cambios.

> **`NEXT_PUBLIC_API_BASE_URL`** es la URL que el **navegador del usuario** usa para llamar al backend.
> En local: `http://localhost:8080`. En servidor remoto: `http://<ip-o-dominio>:8080`.
> Next.js la incrusta en el bundle al compilar — cambia este valor **antes** de construir la imagen.

### 2. Levantar el stack completo

```bash
docker compose up --build
```

Este único comando construye y arranca los tres servicios en orden:

```
db  →  backend  →  frontend
```

La primera vez descarga dependencias de Maven y compila los assets de Next.js (3–5 min). Las siguientes ejecuciones usan caché de Docker y son más rápidas.

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
| Base de datos (PostgreSQL) | `5432` | `DB_HOST_PORT` |

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
cp .env.local.example .env.local   # o crear manualmente

# Instalar dependencias
yarn install

# Modo desarrollo
yarn dev
```

Accede en: **http://localhost:3000**

---

## Variables de entorno

### Docker — `.env` (raíz del proyecto)

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `DB_NAME` | Nombre de la base de datos | `inventory` |
| `DB_USER` | Usuario de PostgreSQL | `myuser` |
| `DB_PASSWORD` | Contraseña del usuario | `mypassword` |
| `DB_SCHEMA` | Schema donde Hibernate crea las tablas | `sysinventarios` |
| `DDL_AUTO` | Estrategia DDL de Hibernate | `update` |
| `DB_HOST_PORT` | Puerto del host para PostgreSQL | `5432` |
| `BACKEND_PORT` | Puerto del host para Spring Boot | `8080` |
| `FRONTEND_PORT` | Puerto del host para Next.js | `3000` |
| `NEXT_PUBLIC_API_BASE_URL` | URL del backend accesible desde el navegador | `http://localhost:8080` |
| `NEXT_PUBLIC_SITE_TITLE` | Título de la aplicación | `Sistema Inventario` |
| `NEXT_PUBLIC_SITE_CLIENT` | Nombre del cliente en el header | `TuZona PC Gamer` |
| `NEXT_PUBLIC_LOGO` | Ruta pública del logotipo | `/img/logo.png` |

### Frontend local — `web/beta/.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_SITE_TITLE=Sistema de Inventario
NEXT_PUBLIC_SITE_CLIENT=TuZonaPCGamer
NEXT_PUBLIC_LOGO=/img/logo.png
```

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
│       ├── java/com/tuzonapcgamer/
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
| El frontend no conecta al backend | `NEXT_PUBLIC_API_BASE_URL` incorrecto | Verifica el valor en `.env` y reconstruye con `docker compose build --no-cache` |
| Error de CORS | Origen del frontend no permitido | Revisa `CorsConfig.java` |
| Puerto ocupado | Otro proceso usa el 3000 u 8080 | Cambia `FRONTEND_PORT` o `BACKEND_PORT` en `.env` |
| Código de barras duplicado | Artículo ya registrado | Usa un código diferente o edita el registro existente |

---

## Licencia

Uso interno — TuZonaPCGamer. Todos los derechos reservados.
