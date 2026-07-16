package com.inventory.config;

import com.inventory.model.Role;
import com.inventory.service.facade.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class AdminSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    @Autowired private UserService userService;

    @Value("${admin.default-password}")
    private String adminDefaultPassword;

    @Override
    public void run(String... args) {
        if (userService.count() > 0) {
            return;
        }

        userService.createUser("admin", adminDefaultPassword, Role.ADMIN, "Administrador");
        log.warn("[AdminSeeder] Usuario 'admin' creado con la contraseña por defecto. " +
                "Cambiarla en producción vía ADMIN_DEFAULT_PASSWORD.");
    }
}
