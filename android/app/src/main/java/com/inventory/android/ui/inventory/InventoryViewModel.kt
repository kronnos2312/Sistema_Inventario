package com.inventory.android.ui.inventory

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.inventory.android.data.local.entity.CategoryEntity
import com.inventory.android.data.local.entity.InventoryItemEntity
import com.inventory.android.data.local.entity.ProductEntity
import com.inventory.android.data.local.entity.imageCodes
import com.inventory.android.di.AppContainer
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.io.FileOutputStream

enum class InventoryFilter { ALL, IN_STOCK, WITHDRAWN }

@OptIn(ExperimentalCoroutinesApi::class)
class InventoryListViewModel : ViewModel() {
    private val repository = AppContainer.instance.inventoryRepository

    private val _filter = MutableStateFlow(InventoryFilter.ALL)
    val filter: StateFlow<InventoryFilter> = _filter.asStateFlow()

    val items: StateFlow<List<InventoryItemEntity>> = _filter
        .flatMapLatest { filter ->
            when (filter) {
                InventoryFilter.ALL -> repository.observeAll()
                InventoryFilter.IN_STOCK -> repository.observeInStock()
                InventoryFilter.WITHDRAWN -> repository.observeWithdrawn()
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun setFilter(filter: InventoryFilter) {
        _filter.value = filter
    }

    fun delete(localId: Long) {
        viewModelScope.launch { repository.delete(localId) }
    }
}

/** Imagen ya subida (tiene código de servidor) lista para mostrarse/guardarse con el ítem. */
data class InventoryImageUi(val code: String, val url: String)

data class InventoryFormUiState(
    val barcode: String = "",
    val quantity: String = "1",
    val arrivalDateMillis: Long = System.currentTimeMillis(),
    val price: String = "",
    val description: String = "",
    val selectedProduct: ProductEntity? = null,
    val newProductName: String = "",
    val newProductBrand: String = "",
    val newProductModel: String = "",
    val newProductCategory: CategoryEntity? = null,
    val images: List<InventoryImageUi> = emptyList(),
    val uploadingImage: Boolean = false,
    val saving: Boolean = false,
    val error: String? = null,
    val saved: Boolean = false
)

class InventoryFormViewModel : ViewModel() {
    private val inventoryRepository = AppContainer.instance.inventoryRepository
    private val productRepository = AppContainer.instance.productRepository
    private val categoryRepository = AppContainer.instance.categoryRepository

    val products: StateFlow<List<ProductEntity>> = productRepository.observeAll()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val categories: StateFlow<List<CategoryEntity>> = categoryRepository.observeAll()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _uiState = MutableStateFlow(InventoryFormUiState())
    val uiState: StateFlow<InventoryFormUiState> = _uiState.asStateFlow()

    private var editingLocalId: Long? = null

    fun prefillBarcode(barcode: String) {
        _uiState.value = _uiState.value.copy(barcode = barcode)
    }

    fun loadForEdit(localId: Long) {
        editingLocalId = localId
        viewModelScope.launch {
            val item = inventoryRepository.getByLocalId(localId) ?: return@launch
            val product = item.productRemoteId?.let { remoteId -> products.value.firstOrNull { it.remoteId == remoteId } }
            _uiState.value = _uiState.value.copy(
                barcode = item.barcode,
                quantity = item.quantity.toString(),
                arrivalDateMillis = item.arrivalDateMillis,
                price = item.price.toString(),
                description = item.description,
                selectedProduct = product,
                newProductName = if (product == null) item.productName else "",
                newProductBrand = if (product == null) item.productBrand else "",
                newProductModel = if (product == null) item.productModel ?: "" else "",
                images = item.imageCodes().map { code -> InventoryImageUi(code, imageUrl(code)) }
            )
        }
    }

    /** URL de descarga de una imagen ya subida (GET /files/{code} sobre el host activo). */
    fun imageUrl(code: String): String {
        val tokenStore = AppContainer.instance.tokenStore
        return "http://${tokenStore.getBackendHost()}:${tokenStore.getBackendPort()}/files/$code"
    }

    /** Sube la imagen seleccionada (cámara o galería) y la agrega a la lista del formulario. */
    fun addImage(context: Context, uri: Uri) {
        _uiState.value = _uiState.value.copy(uploadingImage = true, error = null)
        viewModelScope.launch {
            val part = runCatching { uriToMultipart(context, uri) }.getOrNull()
            val uploaded = part?.let { runCatching { inventoryRepository.uploadImage(it) }.getOrNull() }
            _uiState.value = if (uploaded != null) {
                _uiState.value.copy(
                    uploadingImage = false,
                    images = _uiState.value.images + InventoryImageUi(uploaded.code, imageUrl(uploaded.code))
                )
            } else {
                _uiState.value.copy(uploadingImage = false, error = "No se pudo subir la imagen")
            }
        }
    }

    fun removeImage(code: String) {
        _uiState.value = _uiState.value.copy(images = _uiState.value.images.filterNot { it.code == code })
    }

    private fun uriToMultipart(context: Context, uri: Uri): MultipartBody.Part {
        val contentResolver = context.contentResolver
        val mimeType = contentResolver.getType(uri) ?: "image/jpeg"
        val extension = if (mimeType.contains("png")) "png" else "jpg"
        val tempFile = File.createTempFile("upload_", ".$extension", context.cacheDir)
        contentResolver.openInputStream(uri)!!.use { input ->
            FileOutputStream(tempFile).use { output -> input.copyTo(output) }
        }
        val body = tempFile.asRequestBody(mimeType.toMediaTypeOrNull())
        return MultipartBody.Part.createFormData("file", tempFile.name, body)
    }

    fun onBarcodeChange(value: String) { _uiState.value = _uiState.value.copy(barcode = value, error = null) }
    fun onQuantityChange(value: String) { _uiState.value = _uiState.value.copy(quantity = value) }
    fun onPriceChange(value: String) { _uiState.value = _uiState.value.copy(price = value) }
    fun onDescriptionChange(value: String) { _uiState.value = _uiState.value.copy(description = value) }
    fun onArrivalDateChange(millis: Long) { _uiState.value = _uiState.value.copy(arrivalDateMillis = millis) }

    fun onProductSelected(product: ProductEntity?) {
        _uiState.value = _uiState.value.copy(
            selectedProduct = product,
            newProductName = "", newProductBrand = "", newProductModel = "", newProductCategory = null
        )
    }

    fun onNewProductNameChange(value: String) { _uiState.value = _uiState.value.copy(newProductName = value) }
    fun onNewProductBrandChange(value: String) { _uiState.value = _uiState.value.copy(newProductBrand = value) }
    fun onNewProductModelChange(value: String) { _uiState.value = _uiState.value.copy(newProductModel = value) }
    fun onNewProductCategorySelected(category: CategoryEntity?) { _uiState.value = _uiState.value.copy(newProductCategory = category) }

    fun save() {
        val state = _uiState.value
        val quantity = state.quantity.toIntOrNull()
        val price = state.price.toLongOrNull()

        if (state.barcode.isBlank()) {
            _uiState.value = state.copy(error = "El código de barras es obligatorio")
            return
        }
        if (quantity == null || quantity <= 0) {
            _uiState.value = state.copy(error = "La cantidad debe ser un número mayor a 0")
            return
        }
        if (price == null || price < 0) {
            _uiState.value = state.copy(error = "El precio debe ser un número válido")
            return
        }
        val usingExisting = state.selectedProduct != null
        if (!usingExisting && state.newProductName.isBlank()) {
            _uiState.value = state.copy(error = "Selecciona un producto existente o ingresa uno nuevo")
            return
        }

        _uiState.value = state.copy(saving = true, error = null)
        viewModelScope.launch {
            val id = editingLocalId
            if (id == null) {
                inventoryRepository.create(
                    barcode = state.barcode.trim(),
                    quantity = quantity,
                    arrivalDateMillis = state.arrivalDateMillis,
                    price = price,
                    netValue = null,
                    description = state.description,
                    productRemoteId = state.selectedProduct?.remoteId,
                    productName = state.selectedProduct?.name ?: state.newProductName,
                    productBrand = state.selectedProduct?.brand ?: state.newProductBrand,
                    productModel = state.selectedProduct?.model ?: state.newProductModel.ifBlank { null },
                    productCategoryRemoteId = state.selectedProduct?.categoryRemoteId ?: state.newProductCategory?.remoteId,
                    productCategoryName = state.selectedProduct?.categoryName ?: state.newProductCategory?.name,
                    imageCodes = state.images.map { it.code }
                )
            } else {
                inventoryRepository.update(
                    localId = id,
                    barcode = state.barcode.trim(),
                    quantity = quantity,
                    arrivalDateMillis = state.arrivalDateMillis,
                    price = price,
                    netValue = null,
                    description = state.description,
                    imageCodes = state.images.map { it.code }
                )
            }
            _uiState.value = _uiState.value.copy(saving = false, saved = true)
        }
    }
}
