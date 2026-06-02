package com.company.employee_portal.service;

import com.company.employee_portal.jwt.JwtConfig;
import com.company.employee_portal.dto.request.LoginRequestDto;
import com.company.employee_portal.dto.response.LoginResponseDto;
import com.company.employee_portal.entity.User;
import com.company.employee_portal.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final JwtConfig jwtConfig;
    private final RefreshTokenService refreshTokenService;

    public LoginResponseDto login(LoginRequestDto request) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = (User) authentication.getPrincipal();

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());

        String accessToken = jwtService.generateAccessToken(user, claims);
        String refreshToken = jwtService.generateRefreshToken(user);

        refreshTokenService.save(user, refreshToken);

        return LoginResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtConfig.getAccessTokenExpiry() / 1000)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRoles())
                .departmentName(user.getDepartment().getName())
                .build();
    }
}
