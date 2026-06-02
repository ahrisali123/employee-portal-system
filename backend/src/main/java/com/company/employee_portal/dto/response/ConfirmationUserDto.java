package com.company.employee_portal.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class ConfirmationUserDto {
    private UUID userId;
    private String name;
    private String departmentName;
}
