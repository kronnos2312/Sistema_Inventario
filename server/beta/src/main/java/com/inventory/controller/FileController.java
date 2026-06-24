package com.inventory.controller;

import com.inventory.dto.StoredFileDTO;
import com.inventory.model.StoredFile;
import com.inventory.service.facade.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/files")
public class FileController {

    @Autowired private FileStorageService fileStorageService;

    /** Sube un archivo y retorna su código único. */
    @PostMapping("/upload")
    public ResponseEntity<StoredFileDTO> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty())
            return ResponseEntity.badRequest().build();
        StoredFile stored = fileStorageService.upload(file);
        return ResponseEntity.ok(StoredFileDTO.from(stored));
    }

    /** Descarga un archivo por su código. */
    @GetMapping("/{code}")
    public ResponseEntity<Resource> download(@PathVariable String code) {
        return fileStorageService.findByCode(code).map(meta -> {
            Resource resource = fileStorageService.download(code);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(
                            meta.getContentType() != null ? meta.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + meta.getOriginalName() + "\"")
                    .body(resource);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Retorna los datos del logo actual del sistema. */
    @GetMapping("/config/logo")
    public ResponseEntity<StoredFileDTO> getLogo() {
        StoredFileDTO logo = fileStorageService.getLogoConfig();
        return logo != null ? ResponseEntity.ok(logo) : ResponseEntity.notFound().build();
    }

    /** Sube un nuevo logo y lo establece como logo del sistema. */
    @PostMapping("/config/logo")
    public ResponseEntity<StoredFileDTO> updateLogo(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty())
            return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(fileStorageService.updateLogo(file));
    }
}
