package com.company.employee_portal.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class DepartmentResponseDto {
    private UUID id;
    private String name;
}
