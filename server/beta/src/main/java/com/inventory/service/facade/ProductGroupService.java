package com.inventory.service.facade;

import com.inventory.model.ProductGroup;

import java.util.List;
import java.util.Optional;

public interface ProductGroupService {

    List<ProductGroup> getAll();

    Optional<ProductGroup> getById(Long id);

    ProductGroup save(ProductGroup group);

    void deleteById(Long id);

    ProductGroup setCategories(Long groupId, List<Long> categoryIds);
}
