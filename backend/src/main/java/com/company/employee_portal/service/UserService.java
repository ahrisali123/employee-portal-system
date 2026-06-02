package com.company.employee_portal.service;

import com.company.employee_portal.common.Role;
import com.company.employee_portal.dto.response.ApproverResponseDto;
import com.company.employee_portal.dto.response.DepartmentResponseDto;
import com.company.employee_portal.entity.User;
import com.company.employee_portal.jwt.JwtContext;
import com.company.employee_portal.repository.DepartmentRepository;
import com.company.employee_portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final JwtContext jwtContext;

    public List<ApproverResponseDto> getAllApprovers() {

        UUID currentUserId = jwtContext.getUserId();

        return userRepository.findByRole(Role.ADMIN, currentUserId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<DepartmentResponseDto> getDepartments() {
        return departmentRepository.findAll(Sort.by("name"))
                .stream()
                .map(d -> DepartmentResponseDto.builder()
                        .id(d.getId())
                        .name(d.getName())
                        .build())
                .toList();
    }

    private ApproverResponseDto toDto(User user) {

        return ApproverResponseDto.builder()
                .id(user.getId())
                .name(user.getName())
                .departmentName(user.getDepartment().getName())
                .build();
    }
}
