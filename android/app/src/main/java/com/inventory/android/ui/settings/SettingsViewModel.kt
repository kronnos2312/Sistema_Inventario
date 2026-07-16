package com.inventory.android.ui.settings

import androidx.lifecycle.ViewModel
import com.inventory.android.di.AppContainer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class SettingsUiState(
    val host: String = "",
    val port: String = "",
    val saved: Boolean = false
)

class SettingsViewModel : ViewModel() {
    private val tokenStore = AppContainer.instance.tokenStore

    private val _uiState = MutableStateFlow(
        SettingsUiState(host = tokenStore.getBackendHost(), port = tokenStore.getBackendPort())
    )
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    /** Vuelve a leer host/puerto desde TokenStore — usar al reingresar a la pantalla
     *  (por ejemplo, tras volver del escaneo QR, que guarda directo en TokenStore). */
    fun reload() {
        _uiState.value = SettingsUiState(host = tokenStore.getBackendHost(), port = tokenStore.getBackendPort())
    }

    fun onHostChange(value: String) { _uiState.value = _uiState.value.copy(host = value, saved = false) }
    fun onPortChange(value: String) { _uiState.value = _uiState.value.copy(port = value, saved = false) }

    fun save() {
        val state = _uiState.value
        if (state.host.isBlank() || state.port.toIntOrNull() == null) return
        tokenStore.setBackendServer(state.host.trim(), state.port.trim())
        _uiState.value = state.copy(saved = true)
    }
}
