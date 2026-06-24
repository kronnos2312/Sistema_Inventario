package com.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "inventory_file")
public class InventoryFile extends BaseEntity {

    @Column(name = "code", nullable = false, length = 36)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    @JsonIgnore
    private InventoryItem inventoryItem;

    public InventoryFile() {}

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public InventoryItem getInventoryItem() { return inventoryItem; }
    public void setInventoryItem(InventoryItem inventoryItem) { this.inventoryItem = inventoryItem; }

    public String getUrl() { return "/files/" + code; }
}
