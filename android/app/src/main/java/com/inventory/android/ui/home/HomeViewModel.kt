package com.inventory.android.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.inventory.android.auth.SessionState
import com.inventory.android.di.AppContainer
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn

class HomeViewModel : ViewModel() {
    private val sessionManager = AppContainer.instance.sessionManager
    private val pendingDao = AppContainer.instance.database.pendingOperationDao()

    val sessionState: StateFlow<SessionState> = sessionManager.state

    val pendingCount: StateFlow<Int> = pendingDao.observeCount()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    fun logout() {
        sessionManager.logout()
    }
}
