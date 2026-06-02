package com.company.employee_portal.repository;

import com.company.employee_portal.entity.AnnouncementAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AnnouncementAttachmentRepository extends JpaRepository<AnnouncementAttachment, UUID> {

    List<AnnouncementAttachment> findByAnnouncementId(UUID announcementId);

    void deleteByAnnouncementId(UUID announcementId);
}
