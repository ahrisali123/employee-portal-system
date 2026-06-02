package com.company.employee_portal.dto.request;

import com.company.employee_portal.common.AnnouncementPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@NoArgsConstructor
public class UpdateAnnouncementRequestDto {

    @NotBlank
    private String title;

    @NotBlank
    private String content;

    @NotBlank
    private String category;

    @NotNull
    private AnnouncementPriority priority;

    private boolean requiresAcknowledge;

    private List<UUID> targetDepartmentIds = new ArrayList<>();

    private List<UUID> keepAttachmentIds = new ArrayList<>();

    private boolean publish;
}
