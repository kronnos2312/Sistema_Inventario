package com.inventory.repository;

import com.inventory.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppUserREP extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsernameAndActiveTrue(String username);
    boolean existsByUsername(String username);
}
