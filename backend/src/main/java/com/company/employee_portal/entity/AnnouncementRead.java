package com.company.employee_portal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@Entity
@Table(name = "announcement_reads")
public class AnnouncementRead {

    @EmbeddedId
    private AnnouncementReadId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("announcementId")
    @JoinColumn(name = "announcement_id")
    private Announcement announcement;

    @Column(name = "opened_at", nullable = false)
    private LocalDateTime openedAt;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;
}
