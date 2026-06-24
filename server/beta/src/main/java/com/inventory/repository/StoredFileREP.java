package com.inventory.repository;

import com.inventory.model.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StoredFileREP extends JpaRepository<StoredFile, Long> {
    Optional<StoredFile> findByCode(String code);
}
