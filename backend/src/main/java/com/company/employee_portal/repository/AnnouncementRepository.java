package com.company.employee_portal.repository;

import com.company.employee_portal.common.AnnouncementStatus;
import com.company.employee_portal.entity.Announcement;
import com.company.employee_portal.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {

    @Query("SELECT a FROM Announcement a WHERE a.status = :published OR a.author.id = :authorId ORDER BY a.createdAt DESC")
    List<Announcement> findAllVisibleToAdmin(@Param("authorId") UUID authorId, @Param("published") AnnouncementStatus published);

    @Query("""
            SELECT DISTINCT a FROM Announcement a
            LEFT JOIN a.departments d
            WHERE a.status = :status
            AND (d IS NULL OR d = :dept)
            ORDER BY a.createdAt DESC
            """)
    List<Announcement> findPublishedForDepartment(
            @Param("dept") Department dept,
            @Param("status") AnnouncementStatus status);
}
