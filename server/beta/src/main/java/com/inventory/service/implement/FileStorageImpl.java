package com.inventory.service.implement;

import com.inventory.dto.StoredFileDTO;
import com.inventory.model.StoredFile;
import com.inventory.model.SystemConfig;
import com.inventory.repository.StoredFileREP;
import com.inventory.repository.SystemConfigREP;
import com.inventory.service.facade.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Optional;
import java.util.UUID;

@Service
public class FileStorageImpl implements FileStorageService {

    private static final String LOGO_KEY = "logo";

    @Value("${files.storage.dir}")
    private String storageDir;

    @Autowired private StoredFileREP storedFileREP;
    @Autowired private SystemConfigREP systemConfigREP;

    @Override
    public StoredFile upload(MultipartFile file) {
        String ext = extractExtension(file.getOriginalFilename());
        String code = UUID.randomUUID().toString();

        Path target = Paths.get(storageDir).resolve(code + ext);
        try {
            Files.createDirectories(target.getParent());
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Error al guardar el archivo: " + e.getMessage(), e);
        }

        StoredFile stored = new StoredFile();
        stored.setCode(code);
        stored.setOriginalName(file.getOriginalFilename());
        stored.setContentType(file.getContentType());
        stored.setExtension(ext);
        return storedFileREP.save(stored);
    }

    @Override
    public Resource download(String code) {
        StoredFile file = storedFileREP.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado: " + code));

        Path path = Paths.get(storageDir).resolve(code + file.getExtension());
        Resource resource = new FileSystemResource(path);
        if (!resource.exists())
            throw new RuntimeException("Archivo no encontrado en disco: " + code);
        return resource;
    }

    @Override
    public Optional<StoredFile> findByCode(String code) {
        return storedFileREP.findByCode(code);
    }

    @Override
    public StoredFileDTO getLogoConfig() {
        return systemConfigREP.findById(LOGO_KEY)
                .flatMap(config -> storedFileREP.findByCode(config.getValue()))
                .map(StoredFileDTO::from)
                .orElse(null);
    }

    @Override
    public StoredFileDTO updateLogo(MultipartFile file) {
        StoredFile stored = upload(file);
        systemConfigREP.save(new SystemConfig(LOGO_KEY, stored.getCode()));
        return StoredFileDTO.from(stored);
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf(".")).toLowerCase();
    }
}
