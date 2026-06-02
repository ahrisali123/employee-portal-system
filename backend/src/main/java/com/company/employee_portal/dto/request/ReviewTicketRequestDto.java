package com.company.employee_portal.dto.request;

import com.company.employee_portal.common.ApprovalStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewTicketRequestDto {

    @NotNull(message = "ステータスが必須です。")
    private ApprovalStatus status;

    private String note;

}
