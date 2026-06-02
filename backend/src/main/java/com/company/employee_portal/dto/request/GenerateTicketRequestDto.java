package com.company.employee_portal.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GenerateTicketRequestDto {

    @NotBlank(message = "プロンプト入力が必須です。")
    private String prompt;

}
