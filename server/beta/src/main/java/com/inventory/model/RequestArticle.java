package com.inventory.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "request_article")
public class RequestArticle extends BaseEntity{
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

    /**
     * Cantidad disponible en inventario.
     */
    @Column(name = "quantity", nullable = false)
    private int quantity;

    /**
     * Precio unitario del producto.
     */
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    /**
     * Fecha en que el producto fue ingresado al inventario.
     */
    @Column(name = "arrival_date")
    private Date arrivalDate;

    // --- Getters y Setters ---

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

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Date getArrivalDate() {
        return arrivalDate;
    }

    public void setArrivalDate(Date arrivalDate) {
        this.arrivalDate = arrivalDate;
    }

    public RequestArticle(Date creationAt, Long creatorId, String creatorName, String name, String brand, String model, int quantity, BigDecimal price, Date arrivalDate) {
        super(creationAt, creatorId, creatorName);
        this.name = name;
        this.brand = brand;
        this.model = model;
        this.quantity = quantity;
        this.price = price;
        this.arrivalDate = arrivalDate;
    }

    public RequestArticle(String name, String brand, String model, int quantity, BigDecimal price, Date arrivalDate) {
        this.name = name;
        this.brand = brand;
        this.model = model;
        this.quantity = quantity;
        this.price = price;
        this.arrivalDate = arrivalDate;
    }

    public RequestArticle() {}
}
