package com.company.employee_portal.repository;

import com.company.employee_portal.entity.TicketApproval;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TicketApprovalRepository extends JpaRepository<TicketApproval, UUID> {
    List<TicketApproval> findByTicketIdOrderByStepOrder(UUID ticketId);
}
