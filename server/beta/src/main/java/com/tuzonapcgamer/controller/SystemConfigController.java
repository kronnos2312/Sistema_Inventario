package com.tuzonapcgamer.controller;

import com.tuzonapcgamer.model.SystemConfig;
import com.tuzonapcgamer.repository.SystemConfigREP;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/config")
public class SystemConfigController {

    @Autowired
    private SystemConfigREP repository;

    /** Retorna el valor de una clave de configuración. */
    @GetMapping("/{key}")
    public ResponseEntity<SystemConfig> get(@PathVariable String key) {
        return repository.findById(key)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Crea o actualiza una clave de configuración. */
    @PostMapping
    public ResponseEntity<SystemConfig> save(@RequestBody SystemConfig config) {
        return ResponseEntity.ok(repository.save(config));
    }

    /** Retorna la IP del cliente tal como la ve el servidor. */
    @GetMapping("/client-ip")
    public ResponseEntity<Map<String, String>> clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        String ip = (forwarded != null && !forwarded.isBlank())
                ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
        Map<String, String> body = new HashMap<>();
        body.put("ip", ip);
        return ResponseEntity.ok(body);
    }
}
