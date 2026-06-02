package com.company.employee_portal.repository;

import com.company.employee_portal.entity.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, UUID> {
    List<TicketAttachment> findByTicketId(UUID ticketId);
    void deleteByTicketId(UUID ticketId);
}
