package com.company.employee_portal.service;

import com.company.employee_portal.dto.request.LoginRequestDto;
import com.company.employee_portal.dto.response.LoginResponseDto;

public interface AuthService {

    LoginResponseDto login(LoginRequestDto request);
}
