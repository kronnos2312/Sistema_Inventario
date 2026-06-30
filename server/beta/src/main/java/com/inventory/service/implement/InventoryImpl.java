package com.inventory.service.implement;

import com.inventory.dto.InventoryFileDTO;
import com.inventory.dto.WInventory;
import com.inventory.dto.InventoryDTO;
import com.inventory.model.InventoryFile;
import com.inventory.model.InventoryItem;
import com.inventory.repository.InventoryFileREP;
import com.inventory.repository.InventoryItemREP;
import com.inventory.service.facade.InventoryService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class InventoryImpl implements InventoryService {

    @Autowired private InventoryItemREP repository;
    @Autowired private InventoryFileREP inventoryFileREP;

    @Override
    public List<InventoryItem> getAll() {
        return repository.findAll();
    }

    @Override
    public List<InventoryItem> getAllInStock() {
        return repository.findAllInStock();
    }

    @Override
    public List<InventoryItem> getAllInStockByGroup(Long groupId) {
        return repository.findAllInStockByGroupId(groupId);
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
        InventoryItem saved = save(item);
        syncImages(saved, dto.getImageCodes());
        List<InventoryFile> current = inventoryFileREP.findByInventoryItemId(saved.getId());
        List<InventoryFileDTO> imageDTOs = current.stream()
                .map(img -> new InventoryFileDTO(img.getId(), img.getCode(), img.getUrl()))
                .collect(Collectors.toList());
        dto.setImages(imageDTOs);
        dto.setCodeName("success");
        dto.setMessageName(message);
        return dto;
    }

    private void syncImages(InventoryItem item, List<String> codes) {
        if (codes == null) return;
        List<InventoryFile> existing = inventoryFileREP.findByInventoryItemId(item.getId());
        Set<String> newCodes = new HashSet<>(codes);
        Set<String> existingCodes = existing.stream().map(InventoryFile::getCode).collect(Collectors.toSet());

        List<InventoryFile> toRemove = existing.stream()
                .filter(img -> !newCodes.contains(img.getCode()))
                .collect(Collectors.toList());
        inventoryFileREP.deleteAll(toRemove);

        List<InventoryFile> toAdd = codes.stream()
                .filter(code -> !existingCodes.contains(code))
                .map(code -> {
                    InventoryFile f = new InventoryFile();
                    f.setCode(code);
                    f.setInventoryItem(item);
                    return f;
                })
                .collect(Collectors.toList());
        inventoryFileREP.saveAll(toAdd);
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
