package com.company.employee_portal.repository;

import com.company.employee_portal.entity.EmployeeTicket;
import com.company.employee_portal.entity.TicketApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeTicketRepository extends JpaRepository<EmployeeTicket, UUID> {
    List<EmployeeTicket> findByUserId(UUID userId);

    @Query("SELECT DISTINCT t FROM EmployeeTicket t JOIN TicketApproval a ON a.ticket = t WHERE a.approver.id = :approverId")
    List<EmployeeTicket> findByApproverUserId(@Param("approverId") UUID approverId);
}
