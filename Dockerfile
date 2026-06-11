# =============================================================================
# Stage 1 — Build Spring Boot (Java 17 + Maven)
# =============================================================================
FROM maven:3.9-eclipse-temurin-17-alpine AS backend-build
WORKDIR /build

COPY server/beta/pom.xml .
COPY server/beta/src ./src
RUN mvn clean package -DskipTests -q

# =============================================================================
# Stage 2 — Build Next.js (Node 18)
# =============================================================================
FROM node:18-alpine AS frontend-build
WORKDIR /build

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
ARG NEXT_PUBLIC_LOGO=/img/Testing_LOGO.png
ARG NEXT_PUBLIC_SITE_TITLE=TuZonaPCGamer
ARG NEXT_PUBLIC_SITE_CLIENT=TuZona PC Gamer

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_LOGO=$NEXT_PUBLIC_LOGO \
    NEXT_PUBLIC_SITE_TITLE=$NEXT_PUBLIC_SITE_TITLE \
    NEXT_PUBLIC_SITE_CLIENT=$NEXT_PUBLIC_SITE_CLIENT

COPY web/beta/package*.json ./
RUN npm install
COPY web/beta/ .
RUN npm run build

# =============================================================================
# Stage 3 — Runtime: Java 17 JRE + Node 18 + supervisord
# =============================================================================
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Install Node.js 18 and supervisord
RUN apt-get update && apt-get install -y --no-install-recommends \
        supervisor \
        curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# ── Backend ──────────────────────────────────────────────────────────────────
COPY --from=backend-build /build/target/*.jar /app/backend.jar

# ── Frontend ─────────────────────────────────────────────────────────────────
COPY --from=frontend-build /build/.next        /app/frontend/.next
COPY --from=frontend-build /build/public       /app/frontend/public
COPY --from=frontend-build /build/package.json /app/frontend/package.json
COPY --from=frontend-build /build/node_modules /app/frontend/node_modules
COPY --from=frontend-build /build/next.config.ts /app/frontend/next.config.ts

# ── Process manager ──────────────────────────────────────────────────────────
COPY supervisord.conf /etc/supervisor/conf.d/app.conf

EXPOSE 3000 8080

CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/app.conf"]
