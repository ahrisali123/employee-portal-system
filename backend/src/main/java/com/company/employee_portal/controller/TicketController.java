package com.company.employee_portal.controller;

import com.company.employee_portal.common.ApiResponse;
import com.company.employee_portal.dto.request.CreateTicketRequestDto;
import com.company.employee_portal.dto.request.GenerateTicketRequestDto;
import com.company.employee_portal.dto.request.ReviewTicketRequestDto;
import com.company.employee_portal.dto.request.UpdateTicketRequestDto;
import com.company.employee_portal.dto.response.GenerateTicketResponseDto;
import com.company.employee_portal.dto.response.TicketResponseDto;
import com.company.employee_portal.service.AiTicketService;
import com.company.employee_portal.service.EmployeeTicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final EmployeeTicketService employeeTicketService;
    private final AiTicketService aiTicketService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<Void>> create(
            @Valid @RequestPart("data") CreateTicketRequestDto request,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments) {

        employeeTicketService.save(request, attachments);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("チケット作成しました。", null));
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<GenerateTicketResponseDto>> generate(
            @Valid @RequestBody GenerateTicketRequestDto request) {

        GenerateTicketResponseDto response = aiTicketService.generate(request);

        return ResponseEntity.ok(ApiResponse.success("AIでチケットを生成しました。", response));
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable UUID id,
            @Valid @RequestPart("data") UpdateTicketRequestDto request,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments) {

        employeeTicketService.update(id, request, attachments);

        return ResponseEntity.ok(ApiResponse.success("チケットを修正しました。", null));
    }

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> review(
            @PathVariable UUID id,
            @Valid @RequestBody ReviewTicketRequestDto request) {

        employeeTicketService.review(id, request);

        return ResponseEntity.ok(ApiResponse.success("チケットをレビューしました。", null));
    }

    @PatchMapping("/{id}/withdraw")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<Void>> withdraw(
            @PathVariable UUID id) {

        employeeTicketService.withdraw(id);

        return ResponseEntity.ok(ApiResponse.success("チケットを取り下げしました。", null));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TicketResponseDto>>> getAll() {

        List<TicketResponseDto> response = employeeTicketService.getAll();

        return ResponseEntity.ok(ApiResponse.success("チケット一覧を取得しました。", response));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<TicketResponseDto>>> getAllByUserId() {

        List<TicketResponseDto> response = employeeTicketService.getAllByUserId();

        return ResponseEntity.ok(ApiResponse.success("ログインユーザーのチケット一覧を取得しました。", response));
    }

    @GetMapping("/{ticketId}/attachments/{attachmentId}/download")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> getDownloadUrl(
            @PathVariable UUID ticketId,
            @PathVariable UUID attachmentId) {

        String url = employeeTicketService.getPresignedDownloadUrl(ticketId, attachmentId);

        return ResponseEntity.ok(ApiResponse.success("ダウンロードURLを生成しました。", url));
    }
}
