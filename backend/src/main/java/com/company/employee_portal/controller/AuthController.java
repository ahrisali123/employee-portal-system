package com.company.employee_portal.controller;

import com.company.employee_portal.common.ApiResponse;
import com.company.employee_portal.dto.request.LoginRequestDto;
import com.company.employee_portal.dto.request.RefreshTokenRequestDto;
import com.company.employee_portal.dto.response.LoginResponseDto;
import com.company.employee_portal.dto.response.RefreshTokenResponseDto;
import com.company.employee_portal.service.AuthService;
import com.company.employee_portal.service.RefreshTokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    private final RefreshTokenService refreshTokenService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponseDto>> login(
            @RequestBody @Valid LoginRequestDto request) {

        LoginResponseDto authResponse = authService.login(request);

        return ResponseEntity.ok(ApiResponse.success("認証成功しました。", authResponse));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<RefreshTokenResponseDto>> refreshToken(
            @Valid @RequestBody RefreshTokenRequestDto request){

        RefreshTokenResponseDto refreshTokenResponse = refreshTokenService.refreshToken(request.getRefreshToken());

        return ResponseEntity.ok(ApiResponse.success("アクセストークンの更新に成功しました。", refreshTokenResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody RefreshTokenRequestDto request) {
        refreshTokenService.revoke(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("ログアウト成功しました。",null));
    }
}
