package com.company.employee_portal.repository;

import com.company.employee_portal.entity.AnnouncementRead;
import com.company.employee_portal.entity.AnnouncementReadId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AnnouncementReadRepository extends JpaRepository<AnnouncementRead, AnnouncementReadId> {

    int countByIdAnnouncementIdAndConfirmedAtIsNotNull(UUID announcementId);

    List<AnnouncementRead> findByIdAnnouncementIdAndConfirmedAtIsNotNull(UUID announcementId);

    void deleteByIdAnnouncementId(UUID announcementId);
}
