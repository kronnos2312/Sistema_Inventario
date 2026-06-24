package com.inventory.repository;

import com.inventory.model.InventoryFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryFileREP extends JpaRepository<InventoryFile, Long> {
    List<InventoryFile> findByInventoryItemId(Long inventoryItemId);
}
