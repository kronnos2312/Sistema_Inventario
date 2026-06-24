package com.inventory.service.implement;

import com.inventory.dto.ProductDTO;
import com.inventory.model.Product;
import com.inventory.repository.ProductREP;
import com.inventory.service.facade.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductImpl implements ProductService {

    @Autowired private ProductREP repository;

    @Override
    public Optional<Product> getById(Long id) {
        return repository.findById(id);
    }

    @Override
    public List<Product> getAll() {
        return repository.findAll();
    }

    @Override
    public Product validateOrSave(ProductDTO productDTO) {
        Product product;
        if (productDTO.getId() == 0) {
            // Crear producto nuevo
            product = repository.save(productDTO.cast());
        } else {
            // Usar producto existente
            product = repository.findById(productDTO.getId())
                    .orElseThrow(() -> new RuntimeException("Product no existe"));
        }
        return product;
    }

    @Override
    public Product save(Product product) {
        return repository.save(product);
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
