package com.company.employee_portal.dto.response;

import com.company.employee_portal.common.TicketType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Builder
@Getter
public class GenerateTicketResponseDto {
    private String title;
    private TicketType type;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer amount;
    private String destination;
}
