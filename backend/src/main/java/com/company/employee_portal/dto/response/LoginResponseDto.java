package com.company.employee_portal.dto.response;

import com.company.employee_portal.common.Role;
import lombok.Builder;
import lombok.Getter;

import java.util.Set;

@Builder
@Getter
public class LoginResponseDto {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private long expiresIn;
    private String email;
    private String name;
    private Set<Role> role;
    private String departmentName;
}
