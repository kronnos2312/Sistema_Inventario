package com.inventory.dto;

import com.inventory.model.Category;
import com.inventory.model.Product;

public class ProductDTO {
    private Long id;
    private String name;
    private String brand;
    private String model;
    private Long categoryId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public Product cast() {
        Product current = new Product();
        current.setId(this.id);
        current.setName(this.name);
        current.setBrand(this.brand);
        current.setModel(this.model);
        if (this.categoryId != null) {
            Category cat = new Category();
            cat.setId(this.categoryId);
            current.setCategory(cat);
        }
        return current;
    }
}
