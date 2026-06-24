package com.inventory.dto;

import com.inventory.model.StoredFile;

public class StoredFileDTO {

    private String code;
    private String originalName;
    private String contentType;
    private String url;

    public static StoredFileDTO from(StoredFile file) {
        StoredFileDTO dto = new StoredFileDTO();
        dto.code        = file.getCode();
        dto.originalName = file.getOriginalName();
        dto.contentType  = file.getContentType();
        dto.url          = "/files/" + file.getCode();
        return dto;
    }

    public String getCode()         { return code; }
    public String getOriginalName() { return originalName; }
    public String getContentType()  { return contentType; }
    public String getUrl()          { return url; }
}
