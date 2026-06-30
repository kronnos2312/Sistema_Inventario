package com.inventory.service.facade;

import com.inventory.model.Category;

import java.util.List;
import java.util.Optional;

public interface CategoryService {
    List<Category> getAll();
    Optional<Category> getById(Long id);
    Category save(Category category);
    void deleteById(Long id);
}
