package com.inventory.android.sync

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Estado del último intento de sincronización, visible desde la UI. Antes de esto,
 * cualquier fallo que no fuera de red (p. ej. una respuesta del servidor con un
 * formato inesperado) quedaba silencioso: el usuario solo veía "Todo sincronizado"
 * o una lista vacía, sin ninguna pista de que algo había fallado.
 */
object SyncStatus {
    private val _lastError = MutableStateFlow<String?>(null)
    val lastError: StateFlow<String?> = _lastError.asStateFlow()

    fun reportSuccess() {
        _lastError.value = null
    }

    fun reportError(message: String) {
        _lastError.value = message
    }
}
