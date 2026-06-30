package com.inventory.repository;

import com.inventory.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryREP extends JpaRepository<Category, Long> {
}
