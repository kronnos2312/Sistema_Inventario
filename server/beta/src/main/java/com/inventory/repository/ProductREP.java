package com.inventory.repository;

import com.inventory.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductREP extends JpaRepository<Product, Long> {
}
