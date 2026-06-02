package com.company.employee_portal.dto.response;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class RefreshTokenResponseDto {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private long expiresIn;
}
