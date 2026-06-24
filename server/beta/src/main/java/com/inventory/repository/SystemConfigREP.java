package com.inventory.repository;

import com.inventory.model.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemConfigREP extends JpaRepository<SystemConfig, String> {}
