package com.inventory.repository;

import com.inventory.model.ProductGroup;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductGroupREP extends JpaRepository<ProductGroup, Long> {
}
