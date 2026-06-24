package com.inventory.service.facade;

import com.inventory.dto.StoredFileDTO;
import com.inventory.model.StoredFile;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

public interface FileStorageService {
    StoredFile upload(MultipartFile file);
    Resource download(String code);
    Optional<StoredFile> findByCode(String code);
    StoredFileDTO getLogoConfig();
    StoredFileDTO updateLogo(MultipartFile file);
}
