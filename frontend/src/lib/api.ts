import type { Ticket, ApiResponse, CreateTicketPayload, Role, Approver, Announcement, AnnouncementDepartment, AnnouncementConfirmationStatus } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

// ── トークン更新インターセプター ────────────────────────────────────────────

type RefreshHandler = () => Promise<string>;

let _refreshHandler: RefreshHandler | null = null;
let _refreshPromise: Promise<string> | null = null;
let _onSessionExpired: (() => void) | null = null;

export function setRefreshHandler(fn: RefreshHandler | null) {
  _refreshHandler = fn;
}

export function setSessionExpiredHandler(fn: (() => void) | null) {
  _onSessionExpired = fn;
}

// ── JWTヘルパー ───────────────────────────────────────────────────────────

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

export function getUserIdFromToken(token: string): string {
  const payload = decodeJwtPayload(token);
  return (payload.userId as string) ?? '';
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  const exp = typeof payload.exp === 'number' ? payload.exp : 0;
  return exp * 1000 < Date.now() + 30_000;
}

async function acquireToken(currentToken: string): Promise<string> {
  if (!_refreshPromise) {
    _refreshPromise = _refreshHandler!().finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
}

// ── Fetchラッパー ────────────────────────────────────────────────────

async function doFetch<T>(
  path: string,
  options: RequestInit,
  token?: string,
): Promise<ApiResponse<T>> {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> ?? {}) },
  });
  const body: ApiResponse<T> = await res.json();
  if (!res.ok) {
    const msg = body?.error?.message ?? body?.message ?? `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, body?.error?.code);
  }
  return body;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<ApiResponse<T>> {

  let activeToken = token;
  if (token && _refreshHandler && isTokenExpired(token)) {
    try {
      activeToken = await acquireToken(token);
    } catch {

      activeToken = token;
    }
  }

  try {
    return await doFetch<T>(path, options, activeToken);
  } catch (err) {

    if (err instanceof ApiError && err.status === 401 && token && _refreshHandler) {
      try {
        const newToken = await acquireToken(token);
        return await doFetch<T>(path, options, newToken);
      } catch {
        _onSessionExpired?.();
        throw err;
      }
    }
    throw err;
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

// ── 認証 ──────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const res = await request<{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    email: string;
    name: string;
    role: Role[];
    departmentName: string;
  }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return res.data;
}

export async function refreshToken(token: string) {
  const res = await request<{ accessToken: string; refreshToken: string; expiresIn: number }>(
    '/api/v1/auth/refresh-token',
    { method: 'POST', body: JSON.stringify({ refreshToken: token }) },
  );
  return res.data;
}

export async function logout(token: string, refreshTk: string) {
  await request('/api/v1/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refreshTk }),
  }, token);
}

// ── チケット ───────────────────────────────────────────────────────────────

export async function getMyTickets(token: string): Promise<Ticket[]> {
  const res = await request<Ticket[]>('/api/v1/tickets/me', {}, token);
  return res.data ?? [];
}

export async function getAllTickets(token: string): Promise<Ticket[]> {
  const res = await request<Ticket[]>('/api/v1/tickets', {}, token);
  return res.data ?? [];
}

export async function createTicket(token: string, payload: CreateTicketPayload, attachments?: File[]): Promise<void> {
  const formData = new FormData();
  formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  if (attachments) attachments.forEach((f) => formData.append('attachments', f));
  await request('/api/v1/tickets', { method: 'POST', body: formData }, token);
}

export async function updateTicket(
  token: string,
  ticketId: string,
  payload: CreateTicketPayload,
  keepAttachmentIds?: string[],
  attachments?: File[],
): Promise<void> {
  const formData = new FormData();
  formData.append(
    'data',
    new Blob([JSON.stringify({ ...payload, keepAttachmentIds })], { type: 'application/json' }),
  );
  if (attachments) attachments.forEach((f) => formData.append('attachments', f));
  await request(`/api/v1/tickets/${ticketId}`, { method: 'PATCH', body: formData }, token);
}

export async function getAttachmentDownloadUrl(token: string, ticketId: string, attachmentId: string): Promise<string> {
  const res = await request<string>(`/api/v1/tickets/${ticketId}/attachments/${attachmentId}/download`, {}, token);
  return res.data;
}

export async function reviewTicket(
  token: string,
  id: string,
  status: 'APPROVED' | 'REJECTED',
  note: string,
): Promise<void> {
  await request(`/api/v1/tickets/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  }, token);
}

export async function withdrawTicket(token: string, id: string): Promise<void> {
  await request(`/api/v1/tickets/${id}/withdraw`, { method: 'PATCH' }, token);
}

export async function getApprovers(token: string): Promise<Approver[]> {
  const res = await request<Approver[]>('/api/v1/users/approvers', {}, token);
  return res.data ?? [];
}

// ── お知らせ ─────────────────────────────────────────────────────────

export async function getAnnouncements(token: string): Promise<Announcement[]> {
  const res = await request<Announcement[]>('/api/v1/announcements', {}, token);
  return res.data ?? [];
}

export async function getAnnouncement(token: string, id: string): Promise<Announcement> {
  const res = await request<Announcement>(`/api/v1/announcements/${id}`, {}, token);
  return res.data;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  category: string;
  priority: string;
  requiresAcknowledge: boolean;
  targetDepartmentIds: string[];
  publish: boolean;
}

export async function createAnnouncement(
  token: string,
  payload: CreateAnnouncementPayload,
  attachments?: File[],
): Promise<void> {
  const formData = new FormData();
  formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  if (attachments) attachments.forEach((f) => formData.append('attachments', f));
  await request('/api/v1/announcements', { method: 'POST', body: formData }, token);
}

export interface UpdateAnnouncementPayload extends CreateAnnouncementPayload {
  keepAttachmentIds: string[];
}

export async function updateAnnouncement(
  token: string,
  id: string,
  payload: UpdateAnnouncementPayload,
  attachments?: File[],
): Promise<void> {
  const formData = new FormData();
  formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  if (attachments) attachments.forEach((f) => formData.append('attachments', f));
  await request(`/api/v1/announcements/${id}`, { method: 'PATCH', body: formData }, token);
}

export async function deleteAnnouncement(token: string, id: string): Promise<void> {
  await request(`/api/v1/announcements/${id}`, { method: 'DELETE' }, token);
}

export async function acknowledgeAnnouncement(token: string, id: string): Promise<void> {
  await request(`/api/v1/announcements/${id}/acknowledge`, { method: 'POST' }, token);
}

export async function getAnnouncementAttachmentDownloadUrl(
  token: string,
  announcementId: string,
  attachmentId: string,
): Promise<string> {
  const res = await request<string>(
    `/api/v1/announcements/${announcementId}/attachments/${attachmentId}/download`,
    {},
    token,
  );
  return res.data;
}

export async function getAnnouncementConfirmationStatus(
  token: string,
  id: string,
): Promise<AnnouncementConfirmationStatus> {
  const res = await request<AnnouncementConfirmationStatus>(
    `/api/v1/announcements/${id}/confirmation-status`,
    {},
    token,
  );
  return res.data;
}

export async function getDepartments(token: string): Promise<AnnouncementDepartment[]> {
  const res = await request<AnnouncementDepartment[]>('/api/v1/users/departments', {}, token);
  return res.data ?? [];
}

// ── AIチケット生成 ───────────────────────────────────────────────────

export async function generateTicket(token: string, prompt: string) {
  const res = await request<{
    title: string;
    type: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
    amount: number | null;
    destination: string | null;
  }>(
    '/api/v1/tickets/generate',
    { method: 'POST', body: JSON.stringify({ prompt }) },
    token,
  );
  return res.data;
}
