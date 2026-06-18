package com.tuzonapcgamer.service.facade;

import com.tuzonapcgamer.dto.StoredFileDTO;
import com.tuzonapcgamer.model.StoredFile;
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
