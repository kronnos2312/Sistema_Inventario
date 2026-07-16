package com.inventory.android.ui.inventory

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Outbox
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val dateFormat = SimpleDateFormat("dd/MM/yyyy", Locale("es", "CO"))

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InventoryListScreen(
    onBack: () -> Unit,
    onAdd: () -> Unit,
    onScan: () -> Unit,
    onEdit: (Long) -> Unit,
    onWithdraw: (Long) -> Unit,
    viewModel: InventoryListViewModel = viewModel()
) {
    val items by viewModel.items.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Inventario") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, contentDescription = "Volver") }
                },
                actions = {
                    IconButton(onClick = onScan) { Icon(Icons.Filled.QrCodeScanner, contentDescription = "Escanear") }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onAdd) { Icon(Icons.Filled.Add, contentDescription = "Nuevo ítem") }
        }
    ) { padding ->
        if (items.isEmpty()) {
            Column(modifier = Modifier.fillMaxSize().padding(padding).padding(24.dp)) {
                Text("No hay inventario en stock")
            }
        } else {
            LazyColumn(modifier = Modifier.fillMaxSize().padding(padding)) {
                items(items, key = { it.localId }) { item ->
                    ListItem(
                        headlineContent = { Text(item.productName) },
                        supportingContent = {
                            Column {
                                Row { Text("Código: ${item.barcode} · Cant: ${item.quantity}") }
                                Row { Text("Ingreso: ${dateFormat.format(Date(item.arrivalDateMillis))} · \$${item.price}") }
                                if (item.dirty) Text("Pendiente de sincronizar")
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onEdit(item.localId) }
                            .padding(horizontal = 4.dp),
                        trailingContent = {
                            Row {
                                IconButton(onClick = { onWithdraw(item.localId) }) {
                                    Icon(Icons.Filled.Outbox, contentDescription = "Retirar")
                                }
                                IconButton(onClick = { viewModel.delete(item.localId) }) {
                                    Icon(Icons.Filled.Delete, contentDescription = "Eliminar")
                                }
                            }
                        }
                    )
                    Divider()
                }
            }
        }
    }
}
