package com.company.employee_portal.dto.response;

import com.company.employee_portal.common.ApprovalStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
@Getter
public class TicketApprovalDto {
    private UUID approverId;
    private String approverName;
    private String approverDepartmentName;
    private int stepOrder;
    private ApprovalStatus status;
    private String note;
    private LocalDateTime reviewedAt;
}
