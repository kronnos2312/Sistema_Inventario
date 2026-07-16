package com.inventory.dto;

import com.inventory.model.Role;

public class UpdateRoleRequest {
    private Role role;

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
