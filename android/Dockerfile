# ── Stage 1: Android SDK + build ─────────────────────────────────────────────
# Mismo JDK que el backend (eclipse-temurin:17), en vez de una imagen comunitaria
# de Android SDK no oficial, para mantener reproducibilidad y control de versiones.
FROM eclipse-temurin:17-jdk-jammy AS builder

ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH="${PATH}:${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools"

RUN apt-get update && apt-get install -y --no-install-recommends unzip curl \
    && rm -rf /var/lib/apt/lists/*

# Versión de cmdline-tools fijada por URL (no "latest" flotante del listado de Google).
RUN curl -sSL -o /tmp/cmdline-tools.zip \
      https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip \
    && mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools \
    && unzip -q /tmp/cmdline-tools.zip -d ${ANDROID_SDK_ROOT}/cmdline-tools \
    && mv ${ANDROID_SDK_ROOT}/cmdline-tools/cmdline-tools ${ANDROID_SDK_ROOT}/cmdline-tools/latest \
    && rm /tmp/cmdline-tools.zip

RUN yes | sdkmanager --licenses > /dev/null \
    && sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

WORKDIR /build

# Copiar primero solo los archivos de configuración de Gradle para cachear
# la resolución de dependencias entre builds (patrón usado en server/beta/Dockerfile).
COPY gradlew gradlew.bat ./
COPY gradle ./gradle
COPY build.gradle.kts settings.gradle.kts gradle.properties ./
COPY app/build.gradle.kts app/build.gradle.kts
RUN chmod +x gradlew && ./gradlew --no-daemon help

COPY app ./app

ARG BACKEND_DEFAULT_HOST=localhost
ARG BACKEND_DEFAULT_PORT=8080

RUN ./gradlew :app:assembleDebug --no-daemon --stacktrace \
      -PdefaultBackendHost=${BACKEND_DEFAULT_HOST} \
      -PdefaultBackendPort=${BACKEND_DEFAULT_PORT}

# ── Stage 2: export del artefacto ────────────────────────────────────────────
# Solo produce el .apk y lo copia al volumen montado en runtime (un COPY en
# build time no puede escribir a un bind-mount del host) — mismo patrón que
# el servicio db-init de docker-compose.yml.
FROM alpine AS runner
COPY --from=builder /build/app/build/outputs/apk/debug/app-debug.apk /app-debug.apk
CMD ["sh", "-c", "cp /app-debug.apk /output/sistema-inventario.apk && echo '[android] APK copiado a ./apk/sistema-inventario.apk'"]
