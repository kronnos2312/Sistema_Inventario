package com.inventory.android.auth

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow

sealed class SessionState {
    data object LoggedOut : SessionState()
    data class LoggedIn(val username: String, val role: String) : SessionState()
}

class SessionManager(private val tokenStore: TokenStore) {

    private val _state = MutableStateFlow(initialState())
    val state: StateFlow<SessionState> = _state.asStateFlow()

    // AuthInterceptor emite aquí al recibir 401; la UI observa y navega a Login.
    private val _forceLogoutEvents = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val forceLogoutEvents: SharedFlow<Unit> = _forceLogoutEvents.asSharedFlow()

    val currentRole: String? get() = (state.value as? SessionState.LoggedIn)?.role

    private fun initialState(): SessionState {
        val token = tokenStore.getToken()
        val username = tokenStore.getUsername()
        val role = tokenStore.getRole()
        return if (token != null && username != null && role != null) {
            SessionState.LoggedIn(username, role)
        } else {
            SessionState.LoggedOut
        }
    }

    fun onLoginSuccess(token: String, username: String, role: String) {
        tokenStore.saveSession(token, username, role)
        _state.value = SessionState.LoggedIn(username, role)
    }

    fun logout() {
        tokenStore.clearSession()
        _state.value = SessionState.LoggedOut
    }

    fun notifyUnauthorized() {
        if (_state.value is SessionState.LoggedOut) return
        tokenStore.clearSession()
        _state.value = SessionState.LoggedOut
        _forceLogoutEvents.tryEmit(Unit)
    }
}
