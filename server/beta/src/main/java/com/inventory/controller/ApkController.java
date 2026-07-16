package com.inventory.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/apk")
public class ApkController {

    @Value("${apk.storage.dir}")
    private String storageDir;

    @Value("${apk.file.name}")
    private String fileName;

    /** Descarga el APK de la app Android generado por el servicio Docker "android". */
    @GetMapping("/download")
    public ResponseEntity<Resource> download() {
        Resource resource = new FileSystemResource(Paths.get(storageDir).resolve(fileName));
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.android.package-archive"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(resource);
    }
}
