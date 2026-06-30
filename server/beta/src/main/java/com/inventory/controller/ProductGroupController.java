package com.inventory.controller;

import com.inventory.model.ProductGroup;
import com.inventory.service.facade.ProductGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/product-group")
public class ProductGroupController {

    @Autowired private ProductGroupService service;

    @GetMapping
    public ResponseEntity<List<ProductGroup>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<ProductGroup> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ProductGroup> create(@RequestBody ProductGroup group) {
        if (group.getId() != null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(service.save(group));
    }

    @PutMapping
    public ResponseEntity<ProductGroup> update(@RequestBody ProductGroup group) {
        if (group.getId() == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(service.save(group));
    }

    @DeleteMapping("/id/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/categories")
    public ResponseEntity<ProductGroup> setCategories(
            @PathVariable Long id,
            @RequestBody List<Long> categoryIds) {
        return ResponseEntity.ok(service.setCategories(id, categoryIds));
    }
}
