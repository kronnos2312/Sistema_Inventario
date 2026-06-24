package com.inventory.service.facade;

import com.inventory.dto.WInventory;
import com.inventory.dto.InventoryDTO;
import com.inventory.model.InventoryItem;
import org.springframework.data.domain.Pageable;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface InventoryService {

    List<InventoryItem> getAll();
    List<InventoryItem> getAll(Pageable pageable);

    List<InventoryItem> getdAllByYear(Date date);

    Optional<InventoryItem> getById(Long id);
    Optional<InventoryItem> getByBarCode(String name);

    InventoryItem save(InventoryItem manufacturer);
    InventoryDTO saveWithBarcodeValidation(InventoryItem manufacturer, InventoryDTO dto);
    WInventory SaveOUT(WInventory wInventory);

    void deleteById(Long id);

    // byHARD ResetSYSTEM
    void deleteAll();
}
