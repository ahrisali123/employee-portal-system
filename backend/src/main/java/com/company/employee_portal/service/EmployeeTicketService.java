package com.company.employee_portal.service;

import com.company.employee_portal.common.ApprovalStatus;
import com.company.employee_portal.common.TicketStatus;
import com.company.employee_portal.dto.request.CreateTicketRequestDto;
import com.company.employee_portal.dto.request.ReviewTicketRequestDto;
import com.company.employee_portal.dto.request.UpdateTicketRequestDto;
import com.company.employee_portal.common.ActivityType;
import com.company.employee_portal.dto.response.AttachmentResponseDto;
import com.company.employee_portal.dto.response.TicketActivityDto;
import com.company.employee_portal.dto.response.TicketApprovalDto;
import com.company.employee_portal.dto.response.TicketResponseDto;
import com.company.employee_portal.entity.*;
import com.company.employee_portal.exception.ApiException;
import com.company.employee_portal.exception.ErrorCode;
import com.company.employee_portal.jwt.JwtContext;
import com.company.employee_portal.repository.TicketAttachmentRepository;
import com.company.employee_portal.repository.EmployeeTicketRepository;
import com.company.employee_portal.repository.TicketActivityRepository;
import com.company.employee_portal.repository.TicketApprovalRepository;
import com.company.employee_portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmployeeTicketService {

    private final UserRepository userRepository;
    private final JwtContext jwtContext;
    private final EmployeeTicketRepository employeeTicketRepository;
    private final TicketApprovalRepository ticketApprovalRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final TicketActivityRepository ticketActivityRepository;
    private final StorageService storageService;

    @Transactional
    public void save(CreateTicketRequestDto request, List<MultipartFile> attachments) {
        User creator = userRepository.getReferenceById(getCurrentUserId());

        EmployeeTicket ticket = EmployeeTicket.builder()
                .user(creator)
                .type(request.getType())
                .title(request.getTitle())
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .amount(request.getAmount())
                .destination(request.getDestination())
                .build();

        employeeTicketRepository.save(ticket);

        List<TicketApproval> approvalList = new ArrayList<>();
        for (int i = 0; i < request.getApprovers().size(); i++) {
            approvalList.add(TicketApproval.builder()
                    .ticket(ticket)
                    .approver(userRepository.getReferenceById(request.getApprovers().get(i)))
                    .stepOrder(i + 1)
                    .build());
        }
        ticketApprovalRepository.saveAll(approvalList);

        ticketActivityRepository.save(TicketActivity.builder()
                .ticket(ticket)
                .actor(creator)
                .action(ActivityType.CREATED)
                .build());

        saveAttachments(ticket, attachments);
    }

    @Transactional
    public void review(UUID ticketId, ReviewTicketRequestDto request) {
        EmployeeTicket ticket = employeeTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ApiException(ErrorCode.NO_TICKET_FOUND_BY_ID));

        List<TicketApproval> approvals = ticketApprovalRepository
                .findByTicketIdOrderByStepOrder(ticketId);

        TicketApproval currentStep = approvals.stream()
                .filter(a -> a.getApprover().getId().equals(getCurrentUserId()))
                .findFirst()
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_AN_APPROVER));

        if (currentStep.getStatus() != ApprovalStatus.PENDING) {
            throw new ApiException(ErrorCode.APPROVAL_ALREADY_REVIEWED);
        }

        currentStep.setStatus(request.getStatus());
        currentStep.setNote(request.getNote());
        currentStep.setReviewedAt(LocalDateTime.now());
        ticketApprovalRepository.save(currentStep);

        ActivityType reviewAction = request.getStatus() == ApprovalStatus.APPROVED
                ? ActivityType.APPROVED : ActivityType.REJECTED;
        ticketActivityRepository.save(TicketActivity.builder()
                .ticket(ticket)
                .actor(userRepository.getReferenceById(getCurrentUserId()))
                .action(reviewAction)
                .note(request.getNote())
                .build());

        boolean anyRejected = approvals.stream()
                .anyMatch(a -> a.getStatus() == ApprovalStatus.REJECTED);
        boolean allApproved = approvals.stream()
                .allMatch(a -> a.getStatus() == ApprovalStatus.APPROVED);

        if (anyRejected) {
            ticket.setStatus(TicketStatus.REJECTED);
            employeeTicketRepository.save(ticket);
        } else if (allApproved) {
            ticket.setStatus(TicketStatus.APPROVED);
            employeeTicketRepository.save(ticket);
        }
    }

    public void withdraw(UUID id) {
        EmployeeTicket ticket = employeeTicketRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NO_TICKET_FOUND_BY_ID));

        if (!ticket.getUser().getId().equals(getCurrentUserId())) {
            throw new ApiException(ErrorCode.ACCESS_DENIED);
        }

        if (ticket.getStatus() == TicketStatus.WITHDRAWN) {
            throw new ApiException(ErrorCode.TICKET_ALREADY_WITHDRAWN);
        }

        ticket.setStatus(TicketStatus.WITHDRAWN);
        employeeTicketRepository.save(ticket);

        ticketActivityRepository.save(TicketActivity.builder()
                .ticket(ticket)
                .actor(userRepository.getReferenceById(getCurrentUserId()))
                .action(ActivityType.WITHDRAWN)
                .build());
    }

    public List<TicketResponseDto> getAll() {
        return employeeTicketRepository.findByApproverUserId(getCurrentUserId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<TicketResponseDto> getAllByUserId() {
        return employeeTicketRepository.findByUserId(getCurrentUserId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void update(UUID id, UpdateTicketRequestDto request, List<MultipartFile> attachments) {
        EmployeeTicket ticket = employeeTicketRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NO_TICKET_FOUND_BY_ID));

        User actor = userRepository.getReferenceById(getCurrentUserId());

        if (!ticket.getUser().getId().equals(actor.getId())) {
            throw new ApiException(ErrorCode.ACCESS_DENIED);
        }

        if (ticket.getStatus() != TicketStatus.REJECTED) {
            throw new ApiException(ErrorCode.TICKET_NOT_EDITABLE);
        }

        ticket.setType(request.getType());
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setStartDate(request.getStartDate());
        ticket.setEndDate(request.getEndDate());
        ticket.setAmount(request.getAmount());
        ticket.setDestination(request.getDestination());
        ticket.setStatus(TicketStatus.PENDING);
        employeeTicketRepository.save(ticket);

        List<TicketApproval> oldApprovals = ticketApprovalRepository.findByTicketIdOrderByStepOrder(id);
        ticketApprovalRepository.deleteAll(oldApprovals);
        List<TicketApproval> newApprovals = new ArrayList<>();
        for (int i = 0; i < request.getApprovers().size(); i++) {
            newApprovals.add(TicketApproval.builder()
                    .ticket(ticket)
                    .approver(userRepository.getReferenceById(request.getApprovers().get(i)))
                    .stepOrder(i + 1)
                    .build());
        }
        ticketApprovalRepository.saveAll(newApprovals);

        ticketActivityRepository.save(TicketActivity.builder()
                .ticket(ticket)
                .actor(actor)
                .action(ActivityType.RESUBMITTED)
                .build());

        if (request.getKeepAttachmentIds() != null) {
            List<TicketAttachment> existing = attachmentRepository.findByTicketId(id);
            List<TicketAttachment> toDelete = existing.stream()
                    .filter(a -> !request.getKeepAttachmentIds().contains(a.getId()))
                    .toList();
            attachmentRepository.deleteAll(toDelete);
        }

        saveAttachments(ticket, attachments);
    }

    public String getPresignedDownloadUrl(UUID ticketId, UUID attachmentId) {
        TicketAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ApiException(ErrorCode.FILE_NOT_FOUND));
        if (!attachment.getTicket().getId().equals(ticketId)) {
            throw new ApiException(ErrorCode.FILE_NOT_FOUND);
        }
        return storageService.generatePresignedUrl(attachment.getKey());
    }

    private TicketResponseDto toDto(EmployeeTicket ticket) {
        List<TicketApproval> approvals = ticketApprovalRepository
                .findByTicketIdOrderByStepOrder(ticket.getId());
        List<TicketAttachment> attachments = attachmentRepository
                .findByTicketId(ticket.getId());
        List<TicketActivity> activities = ticketActivityRepository
                .findByTicketIdOrderByCreatedAtAsc(ticket.getId());

        return TicketResponseDto.builder()
                .id(ticket.getId())
                .userId(ticket.getUser().getId())
                .userName(ticket.getUser().getName())
                .departmentName(ticket.getUser().getDepartment().getName())
                .title(ticket.getTitle())
                .type(ticket.getType())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .startDate(ticket.getStartDate())
                .endDate(ticket.getEndDate())
                .amount(ticket.getAmount())
                .destination(ticket.getDestination())
                .attachments(attachments.stream()
                        .map(a -> AttachmentResponseDto.builder()
                                .id(a.getId())
                                .fileName(a.getFileName())
                                .fileType(a.getFileType())
                                .fileSize(a.getFileSize())
                                .uploadedAt(a.getUploadedAt())
                                .build())
                        .toList())
                .activities(activities.stream()
                        .map(a -> TicketActivityDto.builder()
                                .id(a.getId())
                                .actorName(a.getActor().getName())
                                .action(a.getAction())
                                .note(a.getNote())
                                .createdAt(a.getCreatedAt())
                                .build())
                        .toList())
                .createdAt(ticket.getCreatedAt())
                .approvals(approvals.stream()
                        .map(a -> TicketApprovalDto.builder()
                                .approverId(a.getApprover().getId())
                                .approverName(a.getApprover().getName())
                                .approverDepartmentName(a.getApprover().getDepartment().getName())
                                .stepOrder(a.getStepOrder())
                                .status(a.getStatus())
                                .note(a.getNote())
                                .reviewedAt(a.getReviewedAt())
                                .build())
                        .toList())
                .build();
    }

    private void saveAttachments(EmployeeTicket ticket, List<MultipartFile> files) {
        if (files == null) return;
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                String key = storageService.upload(file);
                attachmentRepository.save(TicketAttachment.builder()
                        .ticket(ticket)
                        .key(key)
                        .fileName(file.getOriginalFilename())
                        .fileType(file.getContentType())
                        .fileSize(file.getSize())
                        .build());
            }
        }
    }

    private UUID getCurrentUserId() {
        return jwtContext.getUserId();
    }
}
