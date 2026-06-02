package com.company.employee_portal.jwt;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.jwt")
@Data
public class JwtConfig {
    private String secret;
    private long accessTokenExpiry;
    private long refreshTokenExpiry;
}
