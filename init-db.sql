-- Script ejecutado automáticamente por PostgreSQL al crear el contenedor
-- Solo se ejecuta si el volumen está vacío (primera vez)

CREATE SCHEMA IF NOT EXISTS sysinventarios AUTHORIZATION myuser;

GRANT ALL PRIVILEGES ON SCHEMA sysinventarios TO myuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA sysinventarios TO myuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA sysinventarios TO myuser;
