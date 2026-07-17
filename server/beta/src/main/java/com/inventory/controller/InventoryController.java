package com.inventory.controller;

import com.inventory.dto.WInventory;
import com.inventory.dto.InventoryDTO;
import com.inventory.model.InventoryItem;
import com.inventory.model.Product;
import com.inventory.service.facade.InventoryService;
import com.inventory.service.facade.ProductService;
import com.inventory.websocket.UpdateBroadcastHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

    @Autowired private InventoryService service;
    @Autowired private ProductService productService;
    @Autowired private UpdateBroadcastHandler updates;

    @PostMapping
    public ResponseEntity<InventoryItem> add(@RequestBody InventoryItem object) {
        if(object.getId() != null)
            return ResponseEntity.badRequest().build();
        InventoryItem saved = this.service.save(object);
        updates.broadcast(UpdateBroadcastHandler.INVENTORY);
        return ResponseEntity.ok(saved);
    }

    @PutMapping
    public ResponseEntity<InventoryItem> save(@RequestBody InventoryItem object) {
        if(object.getId() == null)
            return ResponseEntity.badRequest().build();
        InventoryItem saved = this.service.save(object);
        updates.broadcast(UpdateBroadcastHandler.INVENTORY);
        return ResponseEntity.ok(saved);
    }
    @PostMapping("/out")
    public ResponseEntity<WInventory> saveDTO(@RequestBody WInventory object) {
        WInventory result = this.service.SaveOUT(object);
        if (!"error".equals(result.getCodeName())) updates.broadcast(UpdateBroadcastHandler.INVENTORY);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/dto")
    public ResponseEntity<InventoryDTO> saveDTO(@RequestBody InventoryDTO object) {
        boolean newProduct = object.getProduct() != null && object.getProduct().getId() == 0;
        Product keep = productService.validateOrSave(object.getProduct());
        InventoryItem casted = object.cast();
        casted.setProduct(keep);
        InventoryDTO result = this.service.saveWithBarcodeValidation(casted, object);
        if (!"error".equals(result.getCodeName())) {
            updates.broadcast(UpdateBroadcastHandler.INVENTORY);
            if (newProduct) updates.broadcast(UpdateBroadcastHandler.PRODUCT);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/inventory/id/{id}")
    public ResponseEntity<InventoryItem> getById(@PathVariable Long id) {
        return this.service.getById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/inventory/code/{code}")
    public ResponseEntity<InventoryItem> getByCode(@PathVariable String code) {
        return this.service.getByBarCode(code).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/inventory/entry/{date}")
    public ResponseEntity<List<InventoryItem>> getByCode(@PathVariable Date date) {
        List<InventoryItem> elements = this.service.getdAllByYear(date);
        return ResponseEntity.ok(elements);
    }


    @GetMapping
    public ResponseEntity<List<InventoryItem>> getAll() {
        List<InventoryItem> elements = service.getAll();
        return ResponseEntity.ok(elements);
    }

    @GetMapping("/stock")
    public ResponseEntity<List<InventoryItem>> getStock() {
        return ResponseEntity.ok(service.getAllInStock());
    }

    @GetMapping("/stock/group/{groupId}")
    public ResponseEntity<List<InventoryItem>> getStockByGroup(@PathVariable Long groupId) {
        return ResponseEntity.ok(service.getAllInStockByGroup(groupId));
    }

    @DeleteMapping("/inventory/id/{id}")
    public ResponseEntity<InventoryItem> deleteById(@PathVariable Long id) {
        this.service.deleteById(id);
        updates.broadcast(UpdateBroadcastHandler.INVENTORY);
        return ResponseEntity.noContent().build();
    }

}
