package com.company.employee_portal.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshTokenRequestDto {

    @NotBlank(message = "リフレッシュトークンが必須です。")
    private String refreshToken;
}
