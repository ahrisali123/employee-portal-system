package com.company.employee_portal.dto.response;

import com.company.employee_portal.common.ActivityType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
@Getter
public class TicketActivityDto {
    private UUID id;
    private String actorName;
    private ActivityType action;
    private String note;
    private LocalDateTime createdAt;
}
