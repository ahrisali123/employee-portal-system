package com.company.employee_portal.controller;


import com.company.employee_portal.common.ApiResponse;
import com.company.employee_portal.dto.response.ApproverResponseDto;
import com.company.employee_portal.dto.response.DepartmentResponseDto;
import com.company.employee_portal.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/approvers")
    public ResponseEntity<ApiResponse<List<ApproverResponseDto>>> getAllApprovers() {

        List<ApproverResponseDto> response = userService.getAllApprovers();

        return ResponseEntity.ok(ApiResponse.success("承認者の一覧を取得しました。", response));
    }

    @GetMapping("/departments")
    public ResponseEntity<ApiResponse<List<DepartmentResponseDto>>> getDepartments() {

        List<DepartmentResponseDto> response = userService.getDepartments();

        return ResponseEntity.ok(ApiResponse.success("部署一覧を取得しました。", response));
    }
}
