package com.inventory.service.implement;

import com.inventory.model.Category;
import com.inventory.model.ProductGroup;
import com.inventory.repository.CategoryREP;
import com.inventory.repository.ProductGroupREP;
import com.inventory.service.facade.ProductGroupService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductGroupImpl implements ProductGroupService {

    @Autowired private ProductGroupREP repository;
    @Autowired private CategoryREP categoryREP;

    @Override
    public List<ProductGroup> getAll() {
        return repository.findAll();
    }

    @Override
    public Optional<ProductGroup> getById(Long id) {
        return repository.findById(id);
    }

    @Override
    public ProductGroup save(ProductGroup group) {
        return repository.save(group);
    }

    @Override
    public void deleteById(Long id) {
        ProductGroup group = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Grupo no encontrado"));
        group.getCategories().clear();
        repository.save(group);
        repository.deleteById(id);
    }

    @Override
    @Transactional
    public ProductGroup setCategories(Long groupId, List<Long> categoryIds) {
        ProductGroup group = repository.findById(groupId)
                .orElseThrow(() -> new EntityNotFoundException("Grupo no encontrado"));

        List<Category> categories = categoryIds.stream()
                .map(id -> categoryREP.findById(id)
                        .orElseThrow(() -> new EntityNotFoundException("Categoría no encontrada: " + id)))
                .collect(Collectors.toList());

        group.setCategories(categories);
        return repository.save(group);
    }
}
