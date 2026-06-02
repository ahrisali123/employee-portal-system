package com.company.employee_portal.service;

import com.company.employee_portal.dto.response.RefreshTokenResponseDto;
import com.company.employee_portal.entity.RefreshToken;
import com.company.employee_portal.entity.User;
import com.company.employee_portal.exception.ApiException;
import com.company.employee_portal.exception.ErrorCode;
import com.company.employee_portal.jwt.JwtConfig;
import com.company.employee_portal.jwt.JwtService;
import com.company.employee_portal.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtConfig jwtConfig;
    private final JwtService jwtService;

    @Transactional
    public void save(User user, String refreshToken) {
        refreshTokenRepository.deleteByUser(user);

        RefreshToken token = RefreshToken.builder()
                .token(refreshToken)
                .user(user)
                .expiresAt(LocalDateTime.now().plus(jwtConfig.getRefreshTokenExpiry(), ChronoUnit.MILLIS))
                .build();

        refreshTokenRepository.save(token);
    }

    public RefreshTokenResponseDto refreshToken(String refreshToken) {
        RefreshToken saved = this.validate(refreshToken);
        User user = saved.getUser();

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());

        String newAccessToken = jwtService.generateAccessToken(user,claims);

        return RefreshTokenResponseDto.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtConfig.getAccessTokenExpiry() / 1000)
                .build();
    }

    public RefreshToken validate(String refreshToken) {
        RefreshToken token = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new ApiException(ErrorCode.TOKEN_INVALID));

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(ErrorCode.TOKEN_EXPIRED);
        }

        return token;
    }

    @Transactional
    public void revoke(String refreshToken){
        refreshTokenRepository.deleteByToken(refreshToken);
    }

}
