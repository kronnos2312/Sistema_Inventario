package com.tuzonapcgamer.dto;

import com.tuzonapcgamer.model.InventoryItem;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

public class InventoryDTO {
    private Long id;
    private Long quantity;
    private Long price;
    private String description;
    private ProductDTO product;
    private String arrivalDate;
    private String barcode;

    private List<String> imageCodes;
    private List<InventoryFileDTO> images;

    private String codeName;
    private String messageName;

    public List<String> getImageCodes() { return imageCodes; }
    public void setImageCodes(List<String> imageCodes) { this.imageCodes = imageCodes; }

    public List<InventoryFileDTO> getImages() { return images; }
    public void setImages(List<InventoryFileDTO> images) { this.images = images; }

    public String getCodeName() {
        return codeName;
    }

    public void setCodeName(String codeName) {
        this.codeName = codeName;
    }

    public String getMessageName() {
        return messageName;
    }

    public void setMessageName(String messageName) {
        this.messageName = messageName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getQuantity() {
        return quantity;
    }

    public void setQuantity(Long quantity) {
        this.quantity = quantity;
    }

    public Long getPrice() {
        return price;
    }

    public void setPrice(Long price) {
        this.price = price;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ProductDTO getProduct() {
        return product;
    }

    public void setProduct(ProductDTO product) {
        this.product = product;
    }

    public String getArrivalDate() {
        return arrivalDate;
    }

    public void setArrivalDate(String arrivalDate) {
        this.arrivalDate = arrivalDate;
    }

    public String getBarcode() {
        return barcode;
    }

    public void setBarcode(String barcode) {
        this.barcode = barcode;
    }

    public InventoryItem cast(){
        InventoryItem current = new InventoryItem();
        current.setId(this.id);
        current.setBarcode(this.barcode);
        current.setQuantity(this.quantity.intValue());
        current.setArrivalDate(buildFromString(this.arrivalDate));
        current.setPrice(BigDecimal.valueOf(this.price));
        current.setDescription(this.description);

        return current;
    }

    private Date buildFromString(String in){
        LocalDate localDate = LocalDate.parse(in);
        return Date.from(
                localDate.atStartOfDay(ZoneId.systemDefault()).toInstant()
        );
    }
}
