package com.inventory.android.ui.withdraw

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.inventory.android.data.local.entity.InventoryItemEntity
import com.inventory.android.di.AppContainer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class WithdrawHistoryViewModel : ViewModel() {
    private val repository = AppContainer.instance.inventoryRepository

    val withdrawn: StateFlow<List<InventoryItemEntity>> = repository.observeWithdrawn()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
}

data class WithdrawUiState(
    val item: InventoryItemEntity? = null,
    val quantity: String = "",
    val note: String = "",
    val saving: Boolean = false,
    val error: String? = null,
    val saved: Boolean = false
)

class WithdrawViewModel : ViewModel() {
    private val repository = AppContainer.instance.inventoryRepository

    private val _uiState = MutableStateFlow(WithdrawUiState())
    val uiState: StateFlow<WithdrawUiState> = _uiState.asStateFlow()

    fun load(localId: Long) {
        viewModelScope.launch {
            val item = repository.getByLocalId(localId)
            _uiState.value = _uiState.value.copy(item = item, quantity = item?.quantity?.toString() ?: "")
        }
    }

    fun onQuantityChange(value: String) { _uiState.value = _uiState.value.copy(quantity = value, error = null) }
    fun onNoteChange(value: String) { _uiState.value = _uiState.value.copy(note = value) }

    fun confirmWithdraw() {
        val state = _uiState.value
        val item = state.item ?: return
        val requestedQuantity = state.quantity.toIntOrNull()

        if (requestedQuantity == null || requestedQuantity <= 0 || requestedQuantity > item.quantity) {
            _uiState.value = state.copy(error = "Cantidad inválida (máximo ${item.quantity})")
            return
        }

        _uiState.value = state.copy(saving = true, error = null)
        viewModelScope.launch {
            repository.withdraw(
                localId = item.localId,
                dateOutMillis = System.currentTimeMillis(),
                note = state.note.ifBlank { null },
                withdrawQuantity = requestedQuantity
            )
            _uiState.value = _uiState.value.copy(saving = false, saved = true)
        }
    }
}
