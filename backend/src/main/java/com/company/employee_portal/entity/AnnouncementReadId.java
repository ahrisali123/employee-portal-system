package com.company.employee_portal.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class AnnouncementReadId implements Serializable {

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "announcement_id")
    private UUID announcementId;
}
