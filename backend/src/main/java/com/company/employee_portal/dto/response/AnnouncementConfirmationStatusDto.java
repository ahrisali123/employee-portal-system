package com.company.employee_portal.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AnnouncementConfirmationStatusDto {
    private int total;
    private int confirmedCount;
    private int percentage;
    private List<ConfirmationUserDto> confirmed;
    private List<ConfirmationUserDto> pending;
}
