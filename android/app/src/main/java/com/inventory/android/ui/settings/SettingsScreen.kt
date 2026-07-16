package com.inventory.android.ui.settings

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    onScanServerQr: () -> Unit,
    viewModel: SettingsViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()

    // Re-lee host/puerto al reingresar (por ejemplo, al volver del escaneo QR,
    // que guarda directo en TokenStore sin pasar por este ViewModel).
    LaunchedEffect(Unit) { viewModel.reload() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Configuración") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, contentDescription = "Volver") }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(24.dp)
        ) {
            Text("Servidor del sistema de inventario (host y puerto del backend)")

            OutlinedTextField(
                value = state.host,
                onValueChange = viewModel::onHostChange,
                label = { Text("Host / IP") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(top = 16.dp)
            )

            OutlinedTextField(
                value = state.port,
                onValueChange = viewModel::onPortChange,
                label = { Text("Puerto") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
            )

            Button(
                onClick = viewModel::save,
                modifier = Modifier.fillMaxWidth().padding(top = 24.dp)
            ) {
                Text("Guardar")
            }

            if (state.saved) {
                Text("Configuración guardada", modifier = Modifier.padding(top = 12.dp))
            }

            Divider(modifier = Modifier.padding(vertical = 20.dp))

            Text("¿No conoces la IP del servidor? Escanea el código QR que muestra la web en Configuración → Red local (botón QR de \"Backend API\").")

            OutlinedButton(
                onClick = onScanServerQr,
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
            ) {
                Icon(Icons.Filled.QrCodeScanner, contentDescription = null)
                Text(" Escanear código QR", modifier = Modifier.padding(start = 4.dp))
            }
        }
    }
}
