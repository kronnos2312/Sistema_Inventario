package com.inventory.service.implement;

import com.inventory.model.Category;
import com.inventory.repository.CategoryREP;
import com.inventory.service.facade.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryImpl implements CategoryService {

    @Autowired private CategoryREP repository;

    @Override
    public List<Category> getAll() { return repository.findAll(); }

    @Override
    public Optional<Category> getById(Long id) { return repository.findById(id); }

    @Override
    public Category save(Category category) { return repository.save(category); }

    @Override
    public void deleteById(Long id) { repository.deleteById(id); }
}
