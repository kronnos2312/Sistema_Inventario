package com.inventory.android.ui.product

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.inventory.android.data.local.entity.CategoryEntity
import com.inventory.android.data.local.entity.ProductEntity
import com.inventory.android.di.AppContainer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class ProductListViewModel : ViewModel() {
    private val repository = AppContainer.instance.productRepository

    val products: StateFlow<List<ProductEntity>> = repository.observeAll()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun delete(localId: Long) {
        viewModelScope.launch { repository.delete(localId) }
    }
}

data class ProductFormUiState(
    val name: String = "",
    val brand: String = "",
    val model: String = "",
    val selectedCategory: CategoryEntity? = null,
    val saving: Boolean = false,
    val error: String? = null,
    val saved: Boolean = false
)

class ProductFormViewModel : ViewModel() {
    private val productRepository = AppContainer.instance.productRepository
    private val categoryRepository = AppContainer.instance.categoryRepository

    val categories: StateFlow<List<CategoryEntity>> = categoryRepository.observeAll()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _uiState = MutableStateFlow(ProductFormUiState())
    val uiState: StateFlow<ProductFormUiState> = _uiState.asStateFlow()

    private var editingLocalId: Long? = null

    fun loadForEdit(localId: Long) {
        editingLocalId = localId
        viewModelScope.launch {
            val product = productRepository.getByLocalId(localId) ?: return@launch
            val category = product.categoryRemoteId?.let { remoteId ->
                categories.value.firstOrNull { it.remoteId == remoteId }
            }
            _uiState.value = _uiState.value.copy(
                name = product.name,
                brand = product.brand,
                model = product.model ?: "",
                selectedCategory = category
            )
        }
    }

    fun onNameChange(value: String) { _uiState.value = _uiState.value.copy(name = value, error = null) }
    fun onBrandChange(value: String) { _uiState.value = _uiState.value.copy(brand = value, error = null) }
    fun onModelChange(value: String) { _uiState.value = _uiState.value.copy(model = value) }
    fun onCategorySelected(category: CategoryEntity?) { _uiState.value = _uiState.value.copy(selectedCategory = category) }

    fun save() {
        val state = _uiState.value
        if (state.name.isBlank() || state.brand.isBlank()) {
            _uiState.value = state.copy(error = "Nombre y marca son obligatorios")
            return
        }
        _uiState.value = state.copy(saving = true, error = null)
        viewModelScope.launch {
            val id = editingLocalId
            val model = state.model.ifBlank { null }
            if (id == null) {
                productRepository.create(state.name, state.brand, model, state.selectedCategory?.remoteId, state.selectedCategory?.name)
            } else {
                productRepository.update(id, state.name, state.brand, model, state.selectedCategory?.remoteId, state.selectedCategory?.name)
            }
            _uiState.value = _uiState.value.copy(saving = false, saved = true)
        }
    }
}
