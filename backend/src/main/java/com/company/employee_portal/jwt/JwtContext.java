package com.company.employee_portal.jwt;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtContext {

    private final JwtService jwtService;

    private String getToken() {
        HttpServletRequest request = ((ServletRequestAttributes)
                RequestContextHolder.getRequestAttributes()).getRequest();
        String authHeader = request.getHeader("Authorization");
        return authHeader.substring(7);
    }

    public UUID getUserId() {
        return UUID.fromString(jwtService.extractUserId(getToken()));
    }

    public String getRole() {
        return jwtService.extractRole(getToken());
    }

    public String getEmail() {
        return jwtService.extractUsername(getToken());
    }
}
