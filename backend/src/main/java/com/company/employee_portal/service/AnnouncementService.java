package com.company.employee_portal.service;

import com.company.employee_portal.common.AnnouncementStatus;
import com.company.employee_portal.common.Role;
import com.company.employee_portal.dto.request.CreateAnnouncementRequestDto;
import com.company.employee_portal.dto.request.UpdateAnnouncementRequestDto;
import com.company.employee_portal.dto.response.AnnouncementAttachmentResponseDto;
import com.company.employee_portal.dto.response.AnnouncementConfirmationStatusDto;
import com.company.employee_portal.dto.response.AnnouncementResponseDto;
import com.company.employee_portal.dto.response.ConfirmationUserDto;
import com.company.employee_portal.dto.response.DepartmentResponseDto;
import com.company.employee_portal.entity.*;
import com.company.employee_portal.exception.ApiException;
import com.company.employee_portal.exception.ErrorCode;
import com.company.employee_portal.jwt.JwtContext;
import com.company.employee_portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final AnnouncementReadRepository announcementReadRepository;
    private final AnnouncementAttachmentRepository attachmentRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final JwtContext jwtContext;
    private final StorageService storageService;

    @Transactional
    public void create(CreateAnnouncementRequestDto request, List<MultipartFile> attachments) {
        User author = userRepository.getReferenceById(getCurrentUserId());

        List<Department> departments = request.getTargetDepartmentIds().isEmpty()
                ? List.of()
                : departmentRepository.findAllById(request.getTargetDepartmentIds());

        Announcement announcement = Announcement.builder()
                .author(author)
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .priority(request.getPriority())
                .requiresAcknowledge(request.isRequiresAcknowledge())
                .status(request.isPublish() ? AnnouncementStatus.PUBLISHED : AnnouncementStatus.DRAFT)
                .publishedAt(request.isPublish() ? LocalDateTime.now() : null)
                .departments(departments)
                .build();

        announcementRepository.save(announcement);
        saveAttachments(announcement, attachments);
    }

    public List<AnnouncementResponseDto> getAll() {
        UUID userId = getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.ACCESS_DENIED));

        List<Announcement> announcements = user.getRoles().contains(Role.ADMIN)
                ? announcementRepository.findAllVisibleToAdmin(userId, AnnouncementStatus.PUBLISHED)
                : announcementRepository.findPublishedForDepartment(user.getDepartment(), AnnouncementStatus.PUBLISHED);

        return announcements.stream().map(a -> toDto(a, userId)).toList();
    }

    @Transactional
    public AnnouncementResponseDto getById(UUID id) {
        UUID userId = getCurrentUserId();

        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.ANNOUNCEMENT_NOT_FOUND));

        if (announcement.getStatus() != AnnouncementStatus.PUBLISHED && !userId.equals(announcement.getAuthor().getId())) {
            throw new ApiException(ErrorCode.ANNOUNCEMENT_NOT_FOUND);
        }

        if (!userId.equals(announcement.getAuthor().getId())) {
            AnnouncementReadId readId = new AnnouncementReadId(userId, id);
            if (!announcementReadRepository.existsById(readId)) {
                announcementReadRepository.save(AnnouncementRead.builder()
                        .id(readId)
                        .user(userRepository.getReferenceById(userId))
                        .announcement(announcement)
                        .openedAt(LocalDateTime.now())
                        .build());
            }
        }

        return toDto(announcement, userId);
    }

    @Transactional
    public void acknowledge(UUID id) {
        UUID userId = getCurrentUserId();

        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.ANNOUNCEMENT_NOT_FOUND));

        if (announcement.getStatus() != AnnouncementStatus.PUBLISHED) {
            throw new ApiException(ErrorCode.ANNOUNCEMENT_NOT_FOUND);
        }

        AnnouncementReadId readId = new AnnouncementReadId(userId, id);
        AnnouncementRead read = announcementReadRepository.findById(readId)
                .orElseGet(() -> AnnouncementRead.builder()
                        .id(readId)
                        .user(userRepository.getReferenceById(userId))
                        .announcement(announcement)
                        .openedAt(LocalDateTime.now())
                        .build());

        read.setConfirmedAt(LocalDateTime.now());
        announcementReadRepository.save(read);
    }

    @Transactional
    public void update(UUID id, UpdateAnnouncementRequestDto request, List<MultipartFile> attachments) {
        UUID userId = getCurrentUserId();

        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.ANNOUNCEMENT_NOT_FOUND));

        if (!userId.equals(announcement.getAuthor().getId())) {
            throw new ApiException(ErrorCode.ACCESS_DENIED);
        }
        if (announcement.getStatus() != AnnouncementStatus.DRAFT) {
            throw new ApiException(ErrorCode.ANNOUNCEMENT_NOT_EDITABLE);
        }

        announcement.setTitle(request.getTitle());
        announcement.setContent(request.getContent());
        announcement.setCategory(request.getCategory());
        announcement.setPriority(request.getPriority());
        announcement.setRequiresAcknowledge(request.isRequiresAcknowledge());
        announcement.setDepartments(
                request.getTargetDepartmentIds() == null || request.getTargetDepartmentIds().isEmpty()
                        ? List.of()
                        : departmentRepository.findAllById(request.getTargetDepartmentIds())
        );

        if (request.isPublish()) {
            announcement.setStatus(AnnouncementStatus.PUBLISHED);
            announcement.setPublishedAt(LocalDateTime.now());
        }

        Set<UUID> keepIds = request.getKeepAttachmentIds() != null
                ? new HashSet<>(request.getKeepAttachmentIds())
                : Set.of();
        attachmentRepository.findByAnnouncementId(id).forEach(att -> {
            if (!keepIds.contains(att.getId())) {
                storageService.delete(att.getKey());
                attachmentRepository.delete(att);
            }
        });

        saveAttachments(announcement, attachments);
    }

    @Transactional
    public void delete(UUID id) {
        UUID userId = getCurrentUserId();

        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.ANNOUNCEMENT_NOT_FOUND));

        if (!userId.equals(announcement.getAuthor().getId())) {
            throw new ApiException(ErrorCode.ACCESS_DENIED);
        }
        if (announcement.getStatus() != AnnouncementStatus.DRAFT) {
            throw new ApiException(ErrorCode.ANNOUNCEMENT_NOT_EDITABLE);
        }

        attachmentRepository.findByAnnouncementId(id).forEach(att -> storageService.delete(att.getKey()));
        attachmentRepository.deleteByAnnouncementId(id);
        announcementReadRepository.deleteByIdAnnouncementId(id);
        announcementRepository.delete(announcement);
    }

    public String getAttachmentDownloadUrl(UUID announcementId, UUID attachmentId) {
        AnnouncementAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ApiException(ErrorCode.FILE_NOT_FOUND));
        if (!attachment.getAnnouncement().getId().equals(announcementId)) {
            throw new ApiException(ErrorCode.FILE_NOT_FOUND);
        }
        return storageService.generatePresignedUrl(attachment.getKey());
    }

    public AnnouncementConfirmationStatusDto getConfirmationStatus(UUID id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.ANNOUNCEMENT_NOT_FOUND));

        List<User> audience = (announcement.getDepartments().isEmpty()
                ? userRepository.findAll()
                : userRepository.findByDepartmentIn(announcement.getDepartments()))
                .stream()
                .filter(u -> !u.getId().equals(announcement.getAuthor().getId()))
                .toList();

        Set<UUID> confirmedIds = announcementReadRepository
                .findByIdAnnouncementIdAndConfirmedAtIsNotNull(id)
                .stream()
                .map(r -> r.getId().getUserId())
                .collect(Collectors.toSet());

        List<ConfirmationUserDto> confirmed = audience.stream()
                .filter(u -> confirmedIds.contains(u.getId()))
                .map(this::toConfirmationUserDto)
                .toList();

        List<ConfirmationUserDto> pending = audience.stream()
                .filter(u -> !confirmedIds.contains(u.getId()))
                .map(this::toConfirmationUserDto)
                .toList();

        int total = audience.size();
        int confirmedCount = confirmed.size();
        int percentage = total > 0 ? Math.round((float) confirmedCount / total * 100) : 0;

        return AnnouncementConfirmationStatusDto.builder()
                .total(total)
                .confirmedCount(confirmedCount)
                .percentage(percentage)
                .confirmed(confirmed)
                .pending(pending)
                .build();
    }

    private void saveAttachments(Announcement announcement, List<MultipartFile> files) {
        if (files == null) return;
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                String key = storageService.upload(file);
                attachmentRepository.save(AnnouncementAttachment.builder()
                        .announcement(announcement)
                        .key(key)
                        .fileName(file.getOriginalFilename())
                        .fileType(file.getContentType())
                        .fileSize(file.getSize())
                        .build());
            }
        }
    }

    private ConfirmationUserDto toConfirmationUserDto(User u) {
        return ConfirmationUserDto.builder()
                .userId(u.getId())
                .name(u.getName())
                .departmentName(u.getDepartment().getName())
                .build();
    }

    private AnnouncementResponseDto toDto(Announcement a, UUID currentUserId) {
        List<AnnouncementAttachment> attachments = attachmentRepository.findByAnnouncementId(a.getId());
        int acknowledgedCount = announcementReadRepository.countByIdAnnouncementIdAndConfirmedAtIsNotNull(a.getId());
        Optional<AnnouncementRead> myRead = announcementReadRepository
                .findById(new AnnouncementReadId(currentUserId, a.getId()));

        return AnnouncementResponseDto.builder()
                .id(a.getId())
                .title(a.getTitle())
                .content(a.getContent())
                .category(a.getCategory())
                .priority(a.getPriority())
                .status(a.getStatus())
                .requiresAcknowledge(a.isRequiresAcknowledge())
                .publishedAt(a.getPublishedAt())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .authorName(a.getAuthor().getName())
                .authorDepartmentName(a.getAuthor().getDepartment().getName())
                .targetDepartments(a.getDepartments().stream()
                        .map(d -> DepartmentResponseDto.builder().id(d.getId()).name(d.getName()).build())
                        .toList())
                .attachments(attachments.stream()
                        .map(att -> AnnouncementAttachmentResponseDto.builder()
                                .id(att.getId())
                                .fileName(att.getFileName())
                                .fileType(att.getFileType())
                                .fileSize(att.getFileSize())
                                .uploadedAt(att.getUploadedAt())
                                .build())
                        .toList())
                .opened(myRead.isPresent())
                .acknowledged(myRead.map(r -> r.getConfirmedAt() != null).orElse(false))
                .ownAnnouncement(currentUserId.equals(a.getAuthor().getId()))
                .acknowledgedCount(acknowledgedCount)
                .build();
    }

    private UUID getCurrentUserId() {
        return jwtContext.getUserId();
    }
}
