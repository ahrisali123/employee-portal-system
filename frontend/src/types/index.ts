export type Role = 'EMPLOYEE' | 'ADMIN';
export type TicketStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type TicketType =
  | 'ANNUAL_LEAVE' | 'SICK_LEAVE' | 'COMP_LEAVE' | 'SPECIAL_LEAVE' | 'ABSENCE'
  | 'MATERNITY' | 'PATERNITY' | 'CHILDCARE' | 'NURSING' | 'BEREAVEMENT'
  | 'OVERTIME' | 'HOLIDAY_WORK' | 'EARLY_LEAVE' | 'LATE_ARRIVAL'
  | 'TELEWORK' | 'BUSINESS_TRIP'
  | 'EXPENSE' | 'PURCHASE'
  | 'TRAINING' | 'COMMUTE_CHANGE' | 'ADVANCE_SALARY' | 'OTHER';

export interface TicketApproval {
  approverId: string;
  approverName: string;
  approverDepartmentName: string;
  stepOrder: number;
  status: ApprovalStatus;
  note: string | null;
  reviewedAt: string | null;
}

export interface TicketAttachment {
  id: string;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  uploadedAt: string;
}

export type ActivityType = 'CREATED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'RESUBMITTED';

export interface TicketActivity {
  id: string;
  actorName: string;
  action: ActivityType;
  note: string | null;
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  departmentName: string;
  title: string;
  type: TicketType;
  description: string;
  status: TicketStatus;
  startDate: string | null;
  endDate: string | null;
  amount: number | null;
  destination: string | null;
  attachments: TicketAttachment[];
  approvals: TicketApproval[];
  activities: TicketActivity[];
  createdAt: string;
}

export interface AuthUser {
  email: string;
  name: string;
  roles: Role[];
  activeRole: Role;
  departmentName: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
}

export interface Approver {
  id: string;
  name: string;
  departmentName: string;
}

export interface User {
  id: string;
  name: string;
  nameKana: string;
  dept: string;
  title: string;
  role: Role;
}

export interface Attachment {
  name: string;
  size: string;
}

export interface AnnouncementAttachment {
  id: string;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  uploadedAt: string;
}

export interface AnnouncementDepartment {
  id: string;
  name: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'DRAFT' | 'PUBLISHED';
  requiresAcknowledge: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorDepartmentName: string;
  targetDepartments: AnnouncementDepartment[];
  attachments: AnnouncementAttachment[];
  opened: boolean;
  acknowledged: boolean;
  ownAnnouncement: boolean;
  acknowledgedCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    message: string;
    errors?: Record<string, string>;
  };
  timestamp: string;
}

export interface ConfirmationUser {
  userId: string;
  name: string;
  departmentName: string;
}

export interface AnnouncementConfirmationStatus {
  total: number;
  confirmedCount: number;
  percentage: number;
  confirmed: ConfirmationUser[];
  pending: ConfirmationUser[];
}

export interface CreateTicketPayload {
  type: TicketType;
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  amount?: number;
  destination?: string;
  approvers: string[];
}
