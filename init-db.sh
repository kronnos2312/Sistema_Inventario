#!/bin/bash
# Executed automatically by PostgreSQL on first container start (empty volume).
# Reads DB_SCHEMA from the container environment; falls back to 'sysinventarios'.
set -e

SCHEMA="${DB_SCHEMA:-sysinventarios}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE SCHEMA IF NOT EXISTS "${SCHEMA}" AUTHORIZATION "${POSTGRES_USER}";
    GRANT ALL PRIVILEGES ON SCHEMA "${SCHEMA}" TO "${POSTGRES_USER}";
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA "${SCHEMA}" TO "${POSTGRES_USER}";
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "${SCHEMA}" TO "${POSTGRES_USER}";
EOSQL
