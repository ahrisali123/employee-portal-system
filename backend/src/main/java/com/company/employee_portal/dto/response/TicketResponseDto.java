package com.company.employee_portal.dto.response;

import com.company.employee_portal.common.TicketStatus;
import com.company.employee_portal.common.TicketType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Builder
@Getter
public class TicketResponseDto {
    private UUID id;
    private UUID userId;
    private String userName;
    private String departmentName;
    private String title;
    private TicketType type;
    private String description;
    private TicketStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer amount;
    private String destination;
    private List<AttachmentResponseDto> attachments;
    private List<TicketApprovalDto> approvals;
    private List<TicketActivityDto> activities;
    private LocalDateTime createdAt;
}
