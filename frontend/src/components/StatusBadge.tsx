"use client";

import { SEVERITY } from "@/lib/data";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "承認待ち",
  APPROVED: "承認済み",
  REJECTED: "差し戻し",
  WITHDRAWN: "取り下げ",
};

const badgeClasses: Record<string, string> = {
  pending: "bg-status-pending-bg text-status-pending-fg",
  approved: "bg-status-approved-bg text-status-approved-fg",
  rejected: "bg-status-rejected-bg text-status-rejected-fg",
  withdrawn: "bg-status-withdrawn-bg text-status-withdrawn-fg",
};
const dotClasses: Record<string, string> = {
  pending: "bg-status-pending-dot",
  approved: "bg-status-approved-dot",
  rejected: "bg-status-rejected-dot",
  withdrawn: "bg-status-withdrawn-dot",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11.5px] font-medium whitespace-nowrap tracking-[0.01em] ${badgeClasses[key] ?? ""}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotClasses[key] ?? "bg-ink-4"}`}
      />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function TypeBadge({ typeCode }: { typeCode: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11.5px] font-medium bg-bg-subtle text-ink-2 border border-line">
      {typeCode}
    </span>
  );
}

export function SeverityBadge({
  severity,
  readStatus,
}: {
  severity: string;
  readStatus?: boolean;
}) {
  const s = SEVERITY[severity];
  if (!s) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11.5px] font-medium whitespace-nowrap${readStatus ? " animate-pulse" : ""}`}
      style={{ background: s.bg, color: s.fg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: s.dot }}
      />
      {s.label}
    </span>
  );
}
