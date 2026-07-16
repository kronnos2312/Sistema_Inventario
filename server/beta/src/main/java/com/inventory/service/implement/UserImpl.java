package com.inventory.service.implement;

import com.inventory.model.AppUser;
import com.inventory.model.Role;
import com.inventory.repository.AppUserREP;
import com.inventory.service.facade.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class UserImpl implements UserService {

    @Autowired private AppUserREP repository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public Optional<AppUser> findByUsername(String username) {
        return repository.findByUsernameAndActiveTrue(username);
    }

    @Override
    public List<AppUser> getAll() {
        return repository.findAll();
    }

    @Override
    public AppUser createUser(String username, String rawPassword, Role role, String fullName) {
        AppUser user = new AppUser(username, passwordEncoder.encode(rawPassword), role, fullName);
        return repository.save(user);
    }

    @Override
    public boolean existsByUsername(String username) {
        return repository.existsByUsername(username);
    }

    @Override
    public Optional<AppUser> updateRole(Long id, Role role) {
        return repository.findById(id).map(user -> {
            user.setRole(role);
            return repository.save(user);
        });
    }

    @Override
    public Optional<AppUser> setActive(Long id, boolean active) {
        return repository.findById(id).map(user -> {
            user.setActive(active);
            return repository.save(user);
        });
    }

    @Override
    public Optional<AppUser> resetPassword(Long id, String newPassword) {
        return repository.findById(id).map(user -> {
            user.setPasswordHash(passwordEncoder.encode(newPassword));
            return repository.save(user);
        });
    }

    @Override
    public void updateLastLogin(String username) {
        repository.findByUsernameAndActiveTrue(username).ifPresent(user -> {
            user.setLastLoginAt(new Date());
            repository.save(user);
        });
    }

    @Override
    public boolean checkPassword(AppUser user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPasswordHash());
    }

    @Override
    public long count() {
        return repository.count();
    }
}
