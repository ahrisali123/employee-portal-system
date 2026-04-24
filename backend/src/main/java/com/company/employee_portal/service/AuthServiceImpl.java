package com.company.employee_portal.service;

import com.company.employee_portal.jwt.JwtConfig;
import com.company.employee_portal.dto.request.LoginRequestDto;
import com.company.employee_portal.dto.response.LoginResponseDto;
import com.company.employee_portal.entity.User;
import com.company.employee_portal.exception.ApiException;
import com.company.employee_portal.exception.ErrorCode;
import com.company.employee_portal.repository.UserRepository;
import com.company.employee_portal.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final JwtConfig jwtConfig;

    @Override
    public LoginResponseDto login(LoginRequestDto request) {

        // Throws BadCredentialsException if wrong → caught in GlobalExceptionHandler
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        return LoginResponseDto.builder()
                .accessToken(jwtService.generateAccessToken(user))
                .refreshToken(jwtService.generateRefreshToken(user))
                .tokenType("Bearer")
                .expiresIn(jwtConfig.getAccessTokenExpiry() / 1000)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .build();
    }
}
