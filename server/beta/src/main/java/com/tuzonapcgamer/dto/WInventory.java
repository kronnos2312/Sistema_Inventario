package com.tuzonapcgamer.dto;

import java.util.Date;

public class WInventory {
    private Date dateOut;
    private String barCode;
    private String codeName;
    private String messageName;
    private String description;
    private Integer withdrawQuantity;

    public String getMessageName() {
        return messageName;
    }

    public void setMessageName(String messageName) {
        this.messageName = messageName;
    }

    public String getCodeName() {
        return codeName;
    }

    public void setCodeName(String codeName) {
        this.codeName = codeName;
    }

    public Date getDateOut() {
        return dateOut;
    }

    public void setDateOut(Date dateOut) {
        this.dateOut = dateOut;
    }

    public String getBarCode() {
        return barCode;
    }

    public void setBarCode(String barCode) {
        this.barCode = barCode;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getWithdrawQuantity() {
        return withdrawQuantity;
    }

    public void setWithdrawQuantity(Integer withdrawQuantity) {
        this.withdrawQuantity = withdrawQuantity;
    }
}
