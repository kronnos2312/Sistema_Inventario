package com.inventory.android.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Inventory
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Store
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.inventory.android.auth.SessionState
import com.inventory.android.sync.SyncScheduler

private data class HomeAction(val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector, val onClick: () -> Unit)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onProducts: () -> Unit,
    onInventory: () -> Unit,
    onCategories: () -> Unit,
    onWithdrawHistory: () -> Unit,
    onSettings: () -> Unit,
    onLoggedOut: () -> Unit,
    viewModel: HomeViewModel = viewModel()
) {
    val context = LocalContext.current
    val sessionState by viewModel.sessionState.collectAsState()
    val pendingCount by viewModel.pendingCount.collectAsState()

    if (sessionState is SessionState.LoggedOut) {
        onLoggedOut()
        return
    }
    val username = (sessionState as? SessionState.LoggedIn)?.username.orEmpty()
    val role = (sessionState as? SessionState.LoggedIn)?.role.orEmpty()

    val actions = listOf(
        HomeAction("Productos", Icons.Filled.Store, onProducts),
        HomeAction("Inventario", Icons.Filled.Inventory, onInventory),
        HomeAction("Categorías", Icons.Filled.Category, onCategories),
        HomeAction("Historial de retiros", Icons.Filled.History, onWithdrawHistory)
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Sistema Inventario") },
                actions = {
                    IconButton(onClick = onSettings) { Icon(Icons.Filled.Settings, contentDescription = "Configuración") }
                    IconButton(onClick = { viewModel.logout() }) { Icon(Icons.Filled.Logout, contentDescription = "Cerrar sesión") }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            Text("Hola, $username ($role)", style = MaterialTheme.typography.titleMedium)

            Card(modifier = Modifier.fillMaxWidth().padding(top = 12.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        if (pendingCount == 0) "Todo sincronizado" else "$pendingCount cambio(s) pendiente(s) de sincronizar"
                    )
                    Button(
                        onClick = { SyncScheduler.triggerManualSync(context) },
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                    ) {
                        Icon(Icons.Filled.Sync, contentDescription = null)
                        Text(" Sincronizar ahora", modifier = Modifier.padding(start = 4.dp))
                    }
                }
            }

            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(top = 16.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(actions) { action ->
                    Card(
                        modifier = Modifier
                            .padding(8.dp)
                            .fillMaxWidth()
                            .height(110.dp),
                        onClick = action.onClick
                    ) {
                        Column(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.Center,
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(action.icon, contentDescription = action.label)
                            Text(action.label, modifier = Modifier.padding(top = 8.dp))
                        }
                    }
                }
            }
        }
    }
}
