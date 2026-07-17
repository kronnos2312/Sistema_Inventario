package com.inventory.android.util

import java.time.OffsetDateTime

/**
 * El backend serializa java.util.Date como texto ISO-8601 con offset
 * (p. ej. "2026-07-15T00:00:00.000+00:00"), no como epoch millis. Convierte
 * ese texto a millis para las entidades locales, que sí lo guardan como Long.
 */
fun parseIsoToMillis(value: String?): Long? =
    value?.let { runCatching { OffsetDateTime.parse(it).toInstant().toEpochMilli() }.getOrNull() }
