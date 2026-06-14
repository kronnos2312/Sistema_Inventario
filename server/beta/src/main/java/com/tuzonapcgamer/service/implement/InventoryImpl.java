package com.tuzonapcgamer.service.implement;

import com.tuzonapcgamer.dto.WInventory;
import com.tuzonapcgamer.dto.InventoryDTO;
import com.tuzonapcgamer.model.InventoryItem;
import com.tuzonapcgamer.repository.InventoryItemREP;
import com.tuzonapcgamer.service.facade.InventoryService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class InventoryImpl implements InventoryService {

    @Autowired private InventoryItemREP repository;

    @Override
    public List<InventoryItem> getAll() {
        return repository.findAll();
    }

    @Override
    public List<InventoryItem> getAll(Pageable pageable) {
        return repository.findAll();
    }

    @Override
    public List<InventoryItem> getdAllByYear(Date date) {
        return repository.findByArrivalTime(date);
    }

    @Override
    public Optional<InventoryItem> getById(Long id) {
        return repository.findById(id);
    }

    @Override
    public Optional<InventoryItem> getByBarCode(String name) {
        return repository.findByBarCode(name);
    }

    @Override
    public InventoryDTO saveWithBarcodeValidation(
            InventoryItem inventoryItem,
            InventoryDTO dto) {

        if (isBarcodeInvalid(inventoryItem)) {
            return error(dto, "El código de barras es obligatorio.");
        }

        String barcode = inventoryItem.getBarcode();

        // EDICIÓN
        if (inventoryItem.getId() != 0) {

            InventoryItem current = repository.findById(inventoryItem.getId())
                    .orElseThrow(() -> new EntityNotFoundException("Inventario no encontrado."));

            return repository.findByBarCode(barcode)
                    .filter(other -> !other.getId().equals(current.getId()))
                    .map(existing -> error(dto, "El código de barras ya está registrado."))
                    .orElseGet(() -> success(dto, inventoryItem, "Inventario guardado exitosamente."));
        }

        // CREACIÓN
        return repository.findByBarCode(barcode)
                .map(existing -> error(dto, "El código de barras ya está registrado."))
                .orElseGet(() -> success(dto, inventoryItem, "Inventario registrado exitosamente."));
    }

    private boolean isBarcodeInvalid(InventoryItem item) {
        return item.getBarcode() == null || item.getBarcode().isBlank();
    }

    private InventoryDTO success(InventoryDTO dto, InventoryItem item, String message) {
        save(item);
        dto.setCodeName("success");
        dto.setMessageName(message);
        return dto;
    }


    @Override
    public InventoryItem save(InventoryItem manufacturer) {
        if( manufacturer.getId() != 0){
            return repository.save(manufacturer);
        }
        return createInventoryItem(manufacturer);
    }

    @Override
    public WInventory SaveOUT(WInventory wInventory) {
        if (wInventory.getBarCode() == null || wInventory.getBarCode().isBlank()) {
            return error(wInventory, "El código de barras es obligatorio.");
        }
        if (wInventory.getDateOut() == null ) {
            return error(wInventory, "La fecha de Retiro es obligatoria.");
        }

        return repository.findByBarCode(wInventory.getBarCode())
                .map(item -> {
                    int requested = (wInventory.getWithdrawQuantity() != null && wInventory.getWithdrawQuantity() > 0)
                            ? wInventory.getWithdrawQuantity()
                            : item.getQuantity();

                    if (requested >= item.getQuantity()) {
                        // Retiro total: marcar como retirado
                        item.setOutDate(wInventory.getDateOut());
                    } else {
                        // Retiro parcial: reducir quantity, permanece en stock
                        item.setQuantity(item.getQuantity() - requested);
                    }

                    if (wInventory.getDescription() != null && !wInventory.getDescription().isBlank()) {
                        item.setWithdrawalNote(wInventory.getDescription());
                    }
                    repository.save(item);

                    wInventory.setCodeName("success");
                    wInventory.setMessageName("Retiro exitoso.");
                    return wInventory;

                })
                .orElseGet(() ->
                        error(wInventory,
                                "No existe inventario con el código: " + wInventory.getBarCode())
                );
    }

    private WInventory error(WInventory wInventory, String message) {
        wInventory.setCodeName("error");
        wInventory.setMessageName(message);
        return wInventory;
    }

    private InventoryDTO error(InventoryDTO wInventory, String message) {
        wInventory.setCodeName("error");
        wInventory.setMessageName(message);
        return wInventory;
    }

    private InventoryItem createInventoryItem(InventoryItem manufacturer){
        manufacturer.setId(null);
        if( manufacturer.getProduct().getId() == 0){
            manufacturer.getProduct().setId(null);
        }

        return repository.save(manufacturer);
    }


    @Override
    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    @Override
    public void deleteAll() {
        repository.deleteAll();
    }
}
