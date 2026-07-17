package com.inventory.android.sync

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import com.inventory.android.auth.SessionState
import com.inventory.android.di.AppContainer

/**
 * Dispara una sincronización en cuanto el dispositivo recupera conectividad de
 * red, en vez de esperar el próximo ciclo periódico de WorkManager (hasta 15
 * min) o una acción manual del usuario.
 */
object NetworkSyncMonitor {

    fun register(context: Context) {
        val connectivityManager = context.getSystemService(ConnectivityManager::class.java) ?: return
        connectivityManager.registerDefaultNetworkCallback(object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                if (AppContainer.instance.sessionManager.state.value is SessionState.LoggedIn) {
                    SyncScheduler.triggerManualSync(context.applicationContext)
                }
            }
        })
    }
}
