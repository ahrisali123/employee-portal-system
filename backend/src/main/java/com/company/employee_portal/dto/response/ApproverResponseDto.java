package com.company.employee_portal.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Builder
@Getter
public class ApproverResponseDto {
    private UUID id;
    private String name;
    private String departmentName;
}
