package com.tuzonapcgamer.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Date;

@Entity
@Table(name = "inventoryitem")
public class InventoryItem extends BaseEntity{
    /**
     * Código de barras que identifica esta unidad o lote del producto.
     */
    @Column(name = "barcode", nullable = false, unique = true, length = 50)
    private String barcode;

    /**
     * Cantidad de unidades que ingresan con este registro (puede ser 1 o más).
     */
    @Column(name = "quantity", nullable = false)
    private int quantity;

    /**
     * Fecha en que este ítem fue ingresado al inventario.
     */
    @Column(name = "arrival_date", nullable = false)
    private Date arrivalDate;

    /**
     * Fecha en que este ítem fue retirado al inventario.
     */
    @Column(name = "outDate")
    private Date outDate;
    /**
     * Relación con el producto al que pertenece este ítem.
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    /**
     * Relación con el valor del producto al que pertenece este ítem, al momento de su llegada al negocio.
     */
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    /**
     * Relacion con la descripcion del producto estado empaque estado del producto caducidad ETC
     */
    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    /**
     * Nota o motivo registrado en el momento del retiro.
     */
    @Column(name = "withdrawal_note", columnDefinition = "TEXT")
    private String withdrawalNote;

    public InventoryItem(Date creationAt, Long creatorId, String creatorName, String barcode, int quantity, Date arrivalDate, Product product, BigDecimal price, String description) {
        super(creationAt, creatorId, creatorName);
        this.barcode = barcode;
        this.quantity = quantity;
        this.arrivalDate = arrivalDate;
        this.product = product;
        this.price = price;
        this.description = description;
    }

    public InventoryItem(String barcode, int quantity, Date arrivalDate, Product product, BigDecimal price, String description) {
        this.barcode = barcode;
        this.quantity = quantity;
        this.arrivalDate = arrivalDate;
        this.product = product;
        this.price = price;
        this.description = description;
    }


    public InventoryItem() {
    }

    public Date getOutDate() {
        return outDate;
    }

    public void setOutDate(Date outDate) {
        this.outDate = outDate;
    }

    public String getBarcode() {
        return barcode;
    }

    public void setBarcode(String barcode) {
        this.barcode = barcode;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public Date getArrivalDate() {
        return arrivalDate;
    }

    public void setArrivalDate(Date arrivalDate) {
        this.arrivalDate = arrivalDate;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getWithdrawalNote() {
        return withdrawalNote;
    }

    public void setWithdrawalNote(String withdrawalNote) {
        this.withdrawalNote = withdrawalNote;
    }
}
