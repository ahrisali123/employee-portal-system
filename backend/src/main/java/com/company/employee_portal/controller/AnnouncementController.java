package com.company.employee_portal.controller;

import com.company.employee_portal.common.ApiResponse;
import com.company.employee_portal.dto.request.CreateAnnouncementRequestDto;
import com.company.employee_portal.dto.request.UpdateAnnouncementRequestDto;
import com.company.employee_portal.dto.response.AnnouncementConfirmationStatusDto;
import com.company.employee_portal.dto.response.AnnouncementResponseDto;
import com.company.employee_portal.service.AnnouncementService;
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
@RequestMapping("/api/v1/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> create(
            @Valid @RequestPart("data") CreateAnnouncementRequestDto request,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments) {

        announcementService.create(request, attachments);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("お知らせを作成しました。", null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AnnouncementResponseDto>>> getAll() {

        List<AnnouncementResponseDto> response = announcementService.getAll();

        return ResponseEntity.ok(ApiResponse.success("お知らせ一覧を取得しました。", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AnnouncementResponseDto>> getById(@PathVariable UUID id) {

        AnnouncementResponseDto response = announcementService.getById(id);

        return ResponseEntity.ok(ApiResponse.success("お知らせを取得しました。", response));
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable UUID id,
            @Valid @RequestPart("data") UpdateAnnouncementRequestDto request,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments) {

        announcementService.update(id, request, attachments);

        return ResponseEntity.ok(ApiResponse.success("お知らせを更新しました。", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {

        announcementService.delete(id);

        return ResponseEntity.ok(ApiResponse.success("お知らせを削除しました。", null));
    }

    @PostMapping("/{id}/acknowledge")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<Void>> acknowledge(@PathVariable UUID id) {

        announcementService.acknowledge(id);

        return ResponseEntity.ok(ApiResponse.success("お知らせを確認しました。", null));
    }

    @GetMapping("/{id}/confirmation-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AnnouncementConfirmationStatusDto>> getConfirmationStatus(
            @PathVariable UUID id) {

        AnnouncementConfirmationStatusDto response = announcementService.getConfirmationStatus(id);

        return ResponseEntity.ok(ApiResponse.success("確認状況を取得しました。", response));
    }

    @GetMapping("/{announcementId}/attachments/{attachmentId}/download")
    public ResponseEntity<ApiResponse<String>> getDownloadUrl(
            @PathVariable UUID announcementId,
            @PathVariable UUID attachmentId) {

        String url = announcementService.getAttachmentDownloadUrl(announcementId, attachmentId);

        return ResponseEntity.ok(ApiResponse.success("ダウンロードURLを生成しました。", url));
    }
}
