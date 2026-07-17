package com.inventory.controller;

import com.inventory.dto.ProductDTO;
import com.inventory.model.Product;
import com.inventory.service.facade.ProductService;
import com.inventory.websocket.UpdateBroadcastHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/product")
public class ProductController {
    @Autowired private ProductService service;
    @Autowired private UpdateBroadcastHandler updates;

    @PostMapping
    public ResponseEntity<Product> add(@RequestBody Product object) {
        if(object.getId() != null)
            return ResponseEntity.badRequest().build();
        Product saved = this.service.save(object);
        updates.broadcast(UpdateBroadcastHandler.PRODUCT);
        return ResponseEntity.ok(saved);
    }

    @PutMapping
    public ResponseEntity<Product> save(@RequestBody Product object) {
        if(object.getId() == null)
            return ResponseEntity.badRequest().build();
        Product saved = this.service.save(object);
        updates.broadcast(UpdateBroadcastHandler.PRODUCT);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/dto")
    public ResponseEntity<Product> saveDTO(@RequestBody ProductDTO object) {
        if(object.getId() == null)
            return ResponseEntity.badRequest().build();
        Product saved = this.service.save(object.cast());
        updates.broadcast(UpdateBroadcastHandler.PRODUCT);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/inventory/id/{id}")
    public ResponseEntity<Product> getById(@PathVariable Long id) {
        return this.service.getById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAll() {
        List<Product> elements = service.getAll();
        return ResponseEntity.ok(elements);
    }

    @DeleteMapping("/inventory/id/{id}")
    public ResponseEntity<Product> deleteById(@PathVariable Long id) {
        this.service.deleteById(id);
        updates.broadcast(UpdateBroadcastHandler.PRODUCT);
        return ResponseEntity.noContent().build();
    }
}
