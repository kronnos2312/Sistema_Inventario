package com.inventory.android.ui.withdraw

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
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
fun WithdrawHistoryScreen(
    onBack: () -> Unit,
    viewModel: WithdrawHistoryViewModel = viewModel()
) {
    val withdrawn by viewModel.withdrawn.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Historial de retiros") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, contentDescription = "Volver") }
                }
            )
        }
    ) { padding ->
        if (withdrawn.isEmpty()) {
            Column(modifier = Modifier.fillMaxSize().padding(padding).padding(24.dp)) {
                Text("No hay retiros registrados")
            }
        } else {
            LazyColumn(modifier = Modifier.fillMaxSize().padding(padding)) {
                items(withdrawn, key = { it.localId }) { item ->
                    ListItem(
                        headlineContent = { Text(item.productName) },
                        supportingContent = {
                            Column {
                                Text("Código: ${item.barcode}")
                                item.outDateMillis?.let { Text("Retirado: ${dateFormat.format(Date(it))}") }
                                item.withdrawalNote?.let { if (it.isNotBlank()) Text(it) }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp)
                    )
                    Divider()
                }
            }
        }
    }
}
