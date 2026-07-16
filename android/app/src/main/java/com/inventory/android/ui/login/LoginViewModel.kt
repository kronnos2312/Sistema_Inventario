package com.inventory.android.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.inventory.android.data.repository.NoConnectionException
import com.inventory.android.di.AppContainer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val username: String = "",
    val password: String = "",
    val loading: Boolean = false,
    val error: String? = null,
    val isConnectionError: Boolean = false
)

class LoginViewModel : ViewModel() {
    private val authRepository = AppContainer.instance.authRepository

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onUsernameChange(value: String) {
        _uiState.value = _uiState.value.copy(username = value, error = null, isConnectionError = false)
    }

    fun onPasswordChange(value: String) {
        _uiState.value = _uiState.value.copy(password = value, error = null, isConnectionError = false)
    }

    /** Se llama al volver del escaneo QR: limpia el error para que el usuario reintente. */
    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null, isConnectionError = false)
    }

    fun login(onSuccess: () -> Unit) {
        val state = _uiState.value
        if (state.username.isBlank() || state.password.isBlank()) {
            _uiState.value = state.copy(error = "Usuario y contraseña son obligatorios", isConnectionError = false)
            return
        }

        _uiState.value = state.copy(loading = true, error = null, isConnectionError = false)
        viewModelScope.launch {
            val result = authRepository.login(state.username.trim(), state.password)
            result.onSuccess {
                _uiState.value = _uiState.value.copy(loading = false)
                onSuccess()
            }.onFailure { e ->
                _uiState.value = _uiState.value.copy(
                    loading = false,
                    error = e.message ?: "Error desconocido",
                    isConnectionError = e is NoConnectionException
                )
            }
        }
    }
}
