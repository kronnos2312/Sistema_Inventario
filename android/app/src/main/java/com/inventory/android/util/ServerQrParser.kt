package com.inventory.android.util

/**
 * Extrae host:puerto de la URL que trae el QR de acceso generado por la web
 * (Configuración → Red local, botón QR de "Backend API"). Formato esperado:
 * "http://192.168.x.x:8080" (con o sin ruta/slash final).
 */
object ServerQrParser {
    private val URL_REGEX = Regex("""^https?://([^/:\s]+)(?::(\d+))?""")

    data class ServerAddress(val host: String, val port: String)

    fun parse(scannedText: String): ServerAddress? {
        val match = URL_REGEX.find(scannedText.trim()) ?: return null
        val host = match.groupValues[1]
        if (host.isBlank()) return null
        val port = match.groupValues[2].ifBlank { "80" }
        return ServerAddress(host, port)
    }
}
