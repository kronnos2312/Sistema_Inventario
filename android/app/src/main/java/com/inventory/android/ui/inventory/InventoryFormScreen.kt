package com.inventory.android.ui.inventory

import android.Manifest
import android.app.DatePickerDialog
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import java.io.File
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

private val dateFormat = SimpleDateFormat("dd/MM/yyyy", Locale("es", "CO"))

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InventoryFormScreen(
    localId: Long?,
    prefillBarcode: String?,
    onBack: () -> Unit,
    viewModel: InventoryFormViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val products by viewModel.products.collectAsState()
    val categories by viewModel.categories.collectAsState()
    val context = LocalContext.current

    var productMenuExpanded by remember { mutableStateOf(false) }
    var categoryMenuExpanded by remember { mutableStateOf(false) }

    var pendingCameraUri by remember { mutableStateOf<Uri?>(null) }
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        val uri = pendingCameraUri
        if (success && uri != null) viewModel.addImage(context, uri)
        pendingCameraUri = null
    }
    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        )
    }
    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasCameraPermission = granted
        if (granted) {
            val uri = createCaptureUri(context)
            pendingCameraUri = uri
            cameraLauncher.launch(uri)
        }
    }
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri -> if (uri != null) viewModel.addImage(context, uri) }

    LaunchedEffect(localId) {
        if (localId != null) {
            viewModel.loadForEdit(localId)
        } else if (!prefillBarcode.isNullOrBlank()) {
            viewModel.prefillBarcode(prefillBarcode)
        }
    }
    LaunchedEffect(state.saved) {
        if (state.saved) onBack()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (localId == null) "Nuevo ítem de inventario" else "Editar inventario") },
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
            OutlinedTextField(
                value = state.barcode,
                onValueChange = viewModel::onBarcodeChange,
                label = { Text("Código de barras") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = state.quantity,
                onValueChange = viewModel::onQuantityChange,
                label = { Text("Cantidad") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
            )

            OutlinedTextField(
                value = state.price,
                onValueChange = viewModel::onPriceChange,
                label = { Text("Precio") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
            )

            OutlinedButton(
                onClick = {
                    val calendar = Calendar.getInstance().apply { timeInMillis = state.arrivalDateMillis }
                    DatePickerDialog(
                        context,
                        { _, year, month, day ->
                            val picked = Calendar.getInstance().apply { set(year, month, day, 0, 0, 0) }
                            viewModel.onArrivalDateChange(picked.timeInMillis)
                        },
                        calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH)
                    ).show()
                },
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
            ) {
                Text("Fecha de ingreso: ${dateFormat.format(Date(state.arrivalDateMillis))}")
            }

            OutlinedTextField(
                value = state.description,
                onValueChange = viewModel::onDescriptionChange,
                label = { Text("Descripción") },
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
            )

            Divider(modifier = Modifier.padding(vertical = 16.dp))
            Text("Imágenes", style = MaterialTheme.typography.titleMedium)

            if (state.images.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                        .horizontalScroll(rememberScrollState())
                ) {
                    state.images.forEach { image ->
                        Box(modifier = Modifier.padding(end = 8.dp)) {
                            AsyncImage(
                                model = image.url,
                                contentDescription = null,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.size(80.dp).clip(RoundedCornerShape(8.dp))
                            )
                            IconButton(
                                onClick = { viewModel.removeImage(image.code) },
                                modifier = Modifier.align(Alignment.TopEnd).size(20.dp)
                            ) {
                                Icon(
                                    Icons.Filled.Close,
                                    contentDescription = "Quitar imagen",
                                    tint = MaterialTheme.colorScheme.error
                                )
                            }
                        }
                    }
                }
            }

            Row(modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) {
                OutlinedButton(
                    onClick = {
                        if (hasCameraPermission) {
                            val uri = createCaptureUri(context)
                            pendingCameraUri = uri
                            cameraLauncher.launch(uri)
                        } else {
                            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                        }
                    },
                    enabled = !state.uploadingImage,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Filled.CameraAlt, contentDescription = null)
                    Text(" Cámara", modifier = Modifier.padding(start = 4.dp))
                }

                Spacer(modifier = Modifier.padding(start = 8.dp))

                OutlinedButton(
                    onClick = { galleryLauncher.launch("image/*") },
                    enabled = !state.uploadingImage,
                    modifier = Modifier.weight(1f)
                ) {
                    if (state.uploadingImage) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp))
                    } else {
                        Icon(Icons.Filled.PhotoLibrary, contentDescription = null)
                    }
                    Text(
                        if (state.uploadingImage) " Subiendo..." else " Galería",
                        modifier = Modifier.padding(start = 4.dp)
                    )
                }
            }

            Divider(modifier = Modifier.padding(vertical = 16.dp))
            Text("Producto", style = MaterialTheme.typography.titleMedium)

            ExposedDropdownMenuBox(
                expanded = productMenuExpanded,
                onExpandedChange = { productMenuExpanded = it },
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
            ) {
                OutlinedTextField(
                    value = state.selectedProduct?.name ?: "Producto nuevo",
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Producto existente") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = productMenuExpanded) },
                    modifier = Modifier.menuAnchor().fillMaxWidth()
                )
                ExposedDropdownMenu(
                    expanded = productMenuExpanded,
                    onDismissRequest = { productMenuExpanded = false }
                ) {
                    DropdownMenuItem(
                        text = { Text("Producto nuevo") },
                        onClick = { viewModel.onProductSelected(null); productMenuExpanded = false }
                    )
                    products.forEach { product ->
                        DropdownMenuItem(
                            text = { Text("${product.name} (${product.brand})") },
                            onClick = { viewModel.onProductSelected(product); productMenuExpanded = false }
                        )
                    }
                }
            }

            if (state.selectedProduct == null) {
                OutlinedTextField(
                    value = state.newProductName,
                    onValueChange = viewModel::onNewProductNameChange,
                    label = { Text("Nombre del producto nuevo") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
                )
                OutlinedTextField(
                    value = state.newProductBrand,
                    onValueChange = viewModel::onNewProductBrandChange,
                    label = { Text("Marca") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
                )
                OutlinedTextField(
                    value = state.newProductModel,
                    onValueChange = viewModel::onNewProductModelChange,
                    label = { Text("Modelo (opcional)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
                )

                ExposedDropdownMenuBox(
                    expanded = categoryMenuExpanded,
                    onExpandedChange = { categoryMenuExpanded = it },
                    modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
                ) {
                    OutlinedTextField(
                        value = state.newProductCategory?.name ?: "Sin categoría",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Categoría") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = categoryMenuExpanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = categoryMenuExpanded,
                        onDismissRequest = { categoryMenuExpanded = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Sin categoría") },
                            onClick = { viewModel.onNewProductCategorySelected(null); categoryMenuExpanded = false }
                        )
                        categories.forEach { category ->
                            DropdownMenuItem(
                                text = { Text(category.name) },
                                onClick = { viewModel.onNewProductCategorySelected(category); categoryMenuExpanded = false }
                            )
                        }
                    }
                }
            }

            if (state.error != null) {
                Text(state.error!!, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp))
            }

            Button(
                onClick = viewModel::save,
                enabled = !state.saving,
                modifier = Modifier.fillMaxWidth().padding(top = 24.dp)
            ) {
                Text(if (state.saving) "Guardando..." else "Guardar")
            }
        }
    }
}

/** Crea un archivo temporal en caché y expone su Uri vía FileProvider para la captura de cámara. */
private fun createCaptureUri(context: Context): Uri {
    val imagesDir = File(context.cacheDir, "images").apply { mkdirs() }
    val file = File.createTempFile("capture_", ".jpg", imagesDir)
    return FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
}
