package com.company.employee_portal.dto.response;

import com.company.employee_portal.common.AnnouncementPriority;
import com.company.employee_portal.common.AnnouncementStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class AnnouncementResponseDto {
    private UUID id;
    private String title;
    private String content;
    private String category;
    private AnnouncementPriority priority;
    private AnnouncementStatus status;
    private boolean requiresAcknowledge;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String authorName;
    private String authorDepartmentName;
    private List<DepartmentResponseDto> targetDepartments;
    private List<AnnouncementAttachmentResponseDto> attachments;
    private boolean opened;
    private boolean acknowledged;
    private boolean ownAnnouncement;
    private int acknowledgedCount;
}
