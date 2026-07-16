package com.inventory.service.facade;

import com.inventory.model.AppUser;
import com.inventory.model.Role;

import java.util.List;
import java.util.Optional;

public interface UserService {
    Optional<AppUser> findByUsername(String username);

    List<AppUser> getAll();

    AppUser createUser(String username, String rawPassword, Role role, String fullName);

    boolean existsByUsername(String username);

    Optional<AppUser> updateRole(Long id, Role role);

    Optional<AppUser> setActive(Long id, boolean active);

    Optional<AppUser> resetPassword(Long id, String newPassword);

    void updateLastLogin(String username);

    boolean checkPassword(AppUser user, String rawPassword);

    long count();
}
