"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getAllTickets } from "@/lib/api";
import {
  TYPE_INDEX,
  TICKET_CATEGORIES,
  STATUS_FILTERS,
  fmtYen,
  fmtDate,
} from "@/lib/data";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar } from "@/components/Avatar";
import type { Ticket } from "@/types";

const STATUS_JP: Record<string, string> = {
  PENDING: "承認待ち",
  APPROVED: "承認済み",
  REJECTED: "差し戻し",
  WITHDRAWN: "取り下げ",
};

function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function DateCell({ iso }: { iso: string | null }) {
  if (!iso) return <span className="font-mono text-xs text-ink-2">—</span>;
  const d = new Date(iso);
  return (
    <span className="font-mono text-xs text-ink-2">
      {d.getFullYear()}/{String(d.getMonth() + 1).padStart(2, "0")}/
      {String(d.getDate()).padStart(2, "0")}
      <span className="text-ink-4">
        {" "}
        {String(d.getHours()).padStart(2, "0")}:
        {String(d.getMinutes()).padStart(2, "0")}
      </span>
    </span>
  );
}

export default function AllTicketsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<string>("");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user) return;
    getAllTickets(user.accessToken)
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(
    () =>
      tickets.filter((t) => {
        if (statusFilter && t.status !== statusFilter) return false;
        if (catFilter && TYPE_INDEX[t.type]?.categoryKey !== catFilter)
          return false;
        if (q && !t.title.includes(q)) return false;
        return true;
      }),
    [tickets, statusFilter, catFilter, q],
  );

  const handleExportCsv = () => {
    const headers = [
      "タイトル",
      "種別",
      "申請者",
      "部署",
      "ステータス",
      "申請日時",
      "開始日",
      "終了日",
      "金額",
    ];
    const rows = filtered.map((t) => [
      csvCell(t.title),
      csvCell(TYPE_INDEX[t.type]?.label ?? t.type),
      csvCell(t.userName),
      csvCell(t.departmentName),
      csvCell(STATUS_JP[t.status] ?? t.status),
      csvCell(fmtDate(t.createdAt, { withTime: true })),
      csvCell(fmtDate(t.startDate)),
      csvCell(fmtDate(t.endDate)),
      csvCell(t.amount != null ? fmtYen(t.amount) : null),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `すべてのチケット_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = useMemo(
    () => ({
      total: tickets.length,
      pending: tickets.filter((t) => t.status === "PENDING").length,
      approved: tickets.filter((t) => t.status === "APPROVED").length,
      rejected: tickets.filter((t) => t.status === "REJECTED").length,
    }),
    [tickets],
  );

  return (
    <div className="px-8 py-7 pb-16" style={{ maxWidth: 1400 }}>
      <div className="flex items-end justify-between mb-[22px] gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight m-0 mb-1">
            すべてのチケット
          </h1>
          <p className="text-ink-3 text-[13px] m-0">
            全社員から提出された申請の一覧と承認管理。
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-line bg-bg-elev text-ink font-medium text-[13px] hover:bg-bg-hover transition-colors disabled:opacity-40"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
          >
            <Icon name="download" size={14} /> CSVエクスポート
          </button>
        </div>
      </div>

      <div
        className="grid gap-px bg-line border border-line rounded overflow-hidden mb-[22px]"
        style={{ gridTemplateColumns: "repeat(4,1fr)" }}
      >
        {[
          { label: "合計", val: counts.total, color: "" },
          {
            label: "承認待ち",
            val: counts.pending,
            color: "text-status-pending-fg",
          },
          {
            label: "承認済み",
            val: counts.approved,
            color: "text-status-approved-fg",
          },
          {
            label: "差し戻し",
            val: counts.rejected,
            color: "text-status-rejected-fg",
          },
        ].map(({ label, val, color }) => (
          <div
            key={label}
            className="bg-bg-elev px-[18px] py-4 flex flex-col gap-1"
          >
            <span className="text-[11px] font-mono text-ink-3 uppercase tracking-[0.06em]">
              {label}
            </span>
            <span
              className={`font-en text-2xl font-semibold tracking-[-0.02em] flex items-baseline gap-1 ${color}`}
            >
              {val}
              <small className="text-xs font-medium text-ink-3 font-jp">
                件
              </small>
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 mb-3.5 flex-wrap">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="inline-flex bg-bg-elev border border-line rounded overflow-hidden">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.code ?? "all"}
                className={`border-none px-[11px] py-1.5 text-xs border-r border-line last:border-r-0 transition-colors ${statusFilter === f.code ? "bg-ink text-[#F4F2EC]" : "bg-transparent text-ink-3 hover:bg-bg-hover hover:text-ink"}`}
                onClick={() => setStatusFilter(f.code)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select
            className="select-field bg-bg-elev border border-line rounded py-1.5 px-2.5 text-[12.5px] outline-none text-ink focus:border-accent"
            style={{ width: 200 }}
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="">すべてのカテゴリ</option>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-bg-elev border border-line rounded px-2.5">
          <Icon name="search" size={14} className="text-ink-4" />
          <input
            className="border-none outline-none bg-transparent py-[7px] w-[220px] text-[13px]"
            placeholder="タイトル検索"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-bg-elev border border-line rounded overflow-hidden shadow-card">
        {loading ? (
          <div className="py-16 text-center text-ink-3">
            <p>読み込み中...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-ink-3">
            <h3 className="text-ink mt-2 mb-0 text-base font-semibold">
              該当するチケットがありません
            </h3>
            <p className="m-0 text-[13px]">フィルタを変更してください。</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 font-medium px-3.5 py-2.5 border-b border-line bg-bg-subtle whitespace-nowrap">
                  タイトル
                </th>
                <th
                  className="text-left text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 font-medium px-3.5 py-2.5 border-b border-line bg-bg-subtle whitespace-nowrap"
                  style={{ width: 180 }}
                >
                  種別
                </th>
                <th
                  className="text-left text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 font-medium px-3.5 py-2.5 border-b border-line bg-bg-subtle whitespace-nowrap"
                  style={{ width: 160 }}
                >
                  申請者
                </th>
                <th
                  className="text-left text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 font-medium px-3.5 py-2.5 border-b border-line bg-bg-subtle whitespace-nowrap"
                  style={{ width: 120 }}
                >
                  ステータス
                </th>
                <th
                  className="text-left text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 font-medium px-3.5 py-2.5 border-b border-line bg-bg-subtle whitespace-nowrap"
                  style={{ width: 140 }}
                >
                  申請日時
                </th>
                <th
                  className="text-left text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 font-medium px-3.5 py-2.5 border-b border-line bg-bg-subtle whitespace-nowrap"
                  style={{ width: 40 }}
                ></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const typeInfo = TYPE_INDEX[t.type];
                return (
                  <tr
                    key={t.id}
                    className="cursor-pointer transition-colors hover:bg-bg-subtle border-b border-line last:border-b-0"
                    onClick={() => router.push(`/tickets/${t.id}`)}
                  >
                    <td className="px-3.5 py-[13px] text-[13.5px] align-middle">
                      <div className="font-medium">{t.title}</div>
                      {t.amount != null && (
                        <div className="text-xs text-ink-3 mt-0.5">
                          {fmtYen(t.amount)}
                        </div>
                      )}
                    </td>
                    <td className="px-3.5 py-[13px] align-middle">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-medium bg-bg-subtle text-ink-2 border border-line">
                        {typeInfo?.label ?? t.type}
                      </span>
                    </td>
                    <td className="px-3.5 py-[13px] align-middle">
                      <div className="flex items-center gap-2">
                        <Avatar name={t.userName} size={24} />
                        <div className="leading-[1.25]">
                          <div className="text-[13px]">{t.userName}</div>
                          <div className="text-[11px] text-ink-4">
                            {t.departmentName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-[13px] align-middle">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-3.5 py-[13px] align-middle">
                      <DateCell iso={t.createdAt} />
                    </td>
                    <td className="px-3.5 py-[13px] align-middle">
                      <Icon name="chevron" size={12} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
