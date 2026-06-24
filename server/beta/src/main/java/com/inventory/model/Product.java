package com.inventory.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.util.Date;

@Entity
@Table(name = "product")
public class Product extends BaseEntity{

    /**
     * Nombre o descripción del producto.
     * Ejemplo: "Laptop Gamer ASUS TUF F15".
     */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /**
     * Marca del producto. Ejemplo: "ASUS", "Logitech", etc.
     */
    @Column(name = "brand", nullable = false, length = 50)
    private String brand;

    /**
     * Modelo específico del producto. Ejemplo: "FX506HF", "MX Master 3S".
     */
    @Column(name = "model", length = 50)
    private String model;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Product(Date creationAt, Long creatorId, String creatorName, String name, String brand, String model) {
        super(creationAt, creatorId, creatorName);
        this.name = name;
        this.brand = brand;
        this.model = model;
    }

    public Product(String name, String brand, String model) {
        super(new Date(), null, "Usuario No Especificado");
        this.name = name;
        this.brand = brand;
        this.model = model;
    }

    public Product() {

    }
}
