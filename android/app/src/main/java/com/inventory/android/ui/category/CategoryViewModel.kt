package com.inventory.android.ui.category

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.inventory.android.data.local.entity.CategoryEntity
import com.inventory.android.di.AppContainer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class CategoryListViewModel : ViewModel() {
    private val repository = AppContainer.instance.categoryRepository

    val categories: StateFlow<List<CategoryEntity>> = repository.observeAll()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun delete(localId: Long) {
        viewModelScope.launch { repository.delete(localId) }
    }
}

data class CategoryFormUiState(
    val name: String = "",
    val saving: Boolean = false,
    val error: String? = null,
    val saved: Boolean = false
)

class CategoryFormViewModel : ViewModel() {
    private val repository = AppContainer.instance.categoryRepository

    private val _uiState = MutableStateFlow(CategoryFormUiState())
    val uiState: StateFlow<CategoryFormUiState> = _uiState.asStateFlow()

    private var editingLocalId: Long? = null

    fun loadForEdit(localId: Long) {
        editingLocalId = localId
        viewModelScope.launch {
            repository.getByLocalId(localId)?.let {
                _uiState.value = _uiState.value.copy(name = it.name)
            }
        }
    }

    fun onNameChange(value: String) {
        _uiState.value = _uiState.value.copy(name = value, error = null)
    }

    fun save() {
        val name = _uiState.value.name.trim()
        if (name.isBlank()) {
            _uiState.value = _uiState.value.copy(error = "El nombre es obligatorio")
            return
        }
        _uiState.value = _uiState.value.copy(saving = true, error = null)
        viewModelScope.launch {
            val id = editingLocalId
            if (id == null) repository.create(name) else repository.update(id, name)
            _uiState.value = _uiState.value.copy(saving = false, saved = true)
        }
    }
}
