package com.inventory.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.*;

@RestController
@RequestMapping("/network-info")
public class NetworkInfoController {

    @Value("${server.port:8080}")
    private int serverPort;

    // Inyectada por el script de arranque cuando corre en Docker.
    // En desarrollo local sin Docker queda vacía y se usa detección automática.
    @Value("${HOST_IP:}")
    private String envHostIp;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNetworkInfo() {
        List<Map<String, String>> entries = new ArrayList<>();

        // Prioridad 1: IP del host inyectada por el script de arranque (Docker)
        if (envHostIp != null && !envHostIp.isBlank()) {
            Map<String, String> entry = new LinkedHashMap<>();
            entry.put("iface", "WiFi");
            entry.put("ip", envHostIp.trim());
            entries.add(entry);
        }

        // Prioridad 2: Detección automática por interfaces de red (dev local sin Docker)
        // Solo se consideran interfaces WiFi: la IP de Ethernet no sirve para el
        // acceso desde dispositivos móviles en la misma red inalámbrica.
        if (entries.isEmpty()) {
            try {
                Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
                if (interfaces != null) {
                    for (NetworkInterface ni : Collections.list(interfaces)) {
                        if (ni.isLoopback() || !ni.isUp() || !isWifiInterface(ni.getDisplayName())) continue;
                        for (InetAddress addr : Collections.list(ni.getInetAddresses())) {
                            if (!(addr instanceof Inet4Address) || addr.isLoopbackAddress()) continue;
                            String ip = addr.getHostAddress();
                            if (!isDockerIp(ip)) {
                                Map<String, String> entry = new LinkedHashMap<>();
                                entry.put("iface", ni.getDisplayName());
                                entry.put("ip", ip);
                                entries.add(entry);
                            }
                        }
                    }
                }
            } catch (Exception ignored) {}
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("entries", entries);
        result.put("backendPort", String.valueOf(serverPort));
        result.put("hostname", resolveHostname());
        result.put("platform", System.getProperty("os.name", "Unknown"));
        result.put("osVersion", System.getProperty("os.version", ""));

        return ResponseEntity.ok(result);
    }

    private static boolean isWifiInterface(String displayName) {
        if (displayName == null) return false;
        return displayName.toLowerCase().matches(".*(wi-?fi|wlan|wireless).*");
    }

    private static boolean isDockerIp(String ip) {
        String[] parts = ip.split("\\.");
        if (parts.length != 4) return false;
        try {
            int a = Integer.parseInt(parts[0]);
            int b = Integer.parseInt(parts[1]);
            return a == 172 && b >= 16 && b <= 31;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private static String resolveHostname() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "Unknown";
        }
    }
}
