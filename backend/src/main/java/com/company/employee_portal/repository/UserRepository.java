package com.company.employee_portal.repository;

import com.company.employee_portal.common.Role;
import com.company.employee_portal.entity.Department;
import com.company.employee_portal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r = :role AND u.id != :currentUserId")
    List<User> findByRole(@Param("role") Role role, @Param("currentUserId") UUID currentUserId);

    List<User> findByDepartmentIn(List<Department> departments);
}
