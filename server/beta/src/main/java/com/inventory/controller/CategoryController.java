package com.inventory.controller;

import com.inventory.model.Category;
import com.inventory.service.facade.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/category")
public class CategoryController {

    @Autowired private CategoryService service;

    @GetMapping
    public ResponseEntity<List<Category>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PostMapping
    public ResponseEntity<Category> create(@RequestBody Category category) {
        if (category.getId() != null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(service.save(category));
    }

    @PutMapping
    public ResponseEntity<Category> update(@RequestBody Category category) {
        if (category.getId() == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(service.save(category));
    }

    @DeleteMapping("/id/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
