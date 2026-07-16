package com.inventory.controller;

import com.inventory.dto.CreateUserRequest;
import com.inventory.dto.ResetPasswordRequest;
import com.inventory.dto.SetActiveRequest;
import com.inventory.dto.UpdateRoleRequest;
import com.inventory.dto.UserDTO;
import com.inventory.model.AppUser;
import com.inventory.service.facade.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired private UserService service;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAll() {
        List<UserDTO> users = service.getAll().stream().map(UserDTO::from).toList();
        return ResponseEntity.ok(users);
    }

    @PostMapping
    public ResponseEntity<UserDTO> create(@RequestBody CreateUserRequest request) {
        if (service.existsByUsername(request.getUsername())) {
            return ResponseEntity.status(409).build();
        }
        AppUser created = service.createUser(
                request.getUsername(), request.getPassword(), request.getRole(), request.getFullName());
        return ResponseEntity.ok(UserDTO.from(created));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<UserDTO> updateRole(@PathVariable Long id, @RequestBody UpdateRoleRequest request) {
        return service.updateRole(id, request.getRole())
                .map(user -> ResponseEntity.ok(UserDTO.from(user)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/active")
    public ResponseEntity<UserDTO> setActive(@PathVariable Long id, @RequestBody SetActiveRequest request) {
        return service.setActive(id, request.isActive())
                .map(user -> ResponseEntity.ok(UserDTO.from(user)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<UserDTO> resetPassword(@PathVariable Long id, @RequestBody ResetPasswordRequest request) {
        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return service.resetPassword(id, request.getNewPassword())
                .map(user -> ResponseEntity.ok(UserDTO.from(user)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
