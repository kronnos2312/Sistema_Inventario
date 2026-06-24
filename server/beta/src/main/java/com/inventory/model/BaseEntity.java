package com.inventory.model;

import jakarta.persistence.*;

import java.io.Serializable;
import java.util.Date;

@MappedSuperclass
public abstract class BaseEntity implements Serializable {

    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    @Column(name="creationAt")
    private Date creationAt;

    @Column(name="modificationAt")
    private Date modificationAt;

    @Column(name="creatorId")
    private Long creatorId;

    @Column(name="editorId")
    private Long editorId;

    @Column(name="creatorName")
    private String creatorName;

    @Column(name="editorName")
    private String editorName;

    @Column(name="deleteId")
    private Long deleteId;

    @Column(name="deleteName")
    private String deleteName;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Date getCreationAt() {
        return creationAt;
    }

    public void setCreationAt(Date creationAt) {
        this.creationAt = creationAt;
    }

    public Date getModificationAt() {
        return modificationAt;
    }

    public void setModificationAt(Date modificationAt) {
        this.modificationAt = modificationAt;
    }

    public Long getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(Long creatorId) {
        this.creatorId = creatorId;
    }

    public Long getEditorId() {
        return editorId;
    }

    public void setEditorId(Long editorId) {
        this.editorId = editorId;
    }

    public String getCreatorName() {
        return creatorName;
    }

    public void setCreatorName(String creatorName) {
        this.creatorName = creatorName;
    }

    public String getEditorName() {
        return editorName;
    }

    public void setEditorName(String editorName) {
        this.editorName = editorName;
    }

    public Long getDeleteId() {
        return deleteId;
    }

    public void setDeleteId(Long deleteId) {
        this.deleteId = deleteId;
    }

    public String getDeleteName() {
        return deleteName;
    }

    public void setDeleteName(String deleteName) {
        this.deleteName = deleteName;
    }

    public BaseEntity(Date creationAt, Long creatorId, String creatorName) {
        this.creationAt = creationAt;
        this.creatorId = creatorId;
        this.creatorName = creatorName;
    }

    public BaseEntity(){}
}
