package com.company.employee_portal.dto.request;

import com.company.employee_portal.common.TicketType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class UpdateTicketRequestDto {

    @NotNull(message = "種類が必須です。")
    private TicketType type;

    @NotBlank(message = "タイトルが必須です。")
    private String title;

    @NotBlank(message = "説明が必須です。")
    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer amount;

    private String destination;

    @NotEmpty(message = "申請先が1つ以上必須です。")
    private List<UUID> approvers;

    private List<UUID> keepAttachmentIds;
}
