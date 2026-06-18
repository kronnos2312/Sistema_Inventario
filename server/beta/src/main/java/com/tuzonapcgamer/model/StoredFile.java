package com.tuzonapcgamer.model;

import jakarta.persistence.*;

@Entity
@Table(name = "stored_file")
public class StoredFile extends BaseEntity {

    @Column(name = "code", unique = true, nullable = false, length = 36)
    private String code;

    @Column(name = "original_name")
    private String originalName;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "extension", length = 10)
    private String extension;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getOriginalName() { return originalName; }
    public void setOriginalName(String originalName) { this.originalName = originalName; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public String getExtension() { return extension; }
    public void setExtension(String extension) { this.extension = extension; }
}
