package com.inventory.android

import android.app.Application
import com.inventory.android.auth.SessionState
import com.inventory.android.di.AppContainer
import com.inventory.android.sync.SyncScheduler

class InventoryApp : Application() {
    override fun onCreate() {
        super.onCreate()
        AppContainer.init(this)

        if (AppContainer.instance.sessionManager.state.value is SessionState.LoggedIn) {
            SyncScheduler.schedulePeriodic(this)
            // Al abrir la app con sesión ya activa, consulta el backend de inmediato en
            // vez de esperar el próximo ciclo periódico (hasta 15 min) o el botón manual.
            SyncScheduler.triggerManualSync(this)
        }
    }
}
