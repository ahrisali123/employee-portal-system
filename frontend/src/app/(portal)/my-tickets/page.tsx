"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getMyTickets, withdrawTicket } from "@/lib/api";
import { TYPE_INDEX, STATUS_FILTERS, fmtYen } from "@/lib/data";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import type { Ticket } from "@/types";

function DateCell({ iso }: { iso: string | null }) {
  if (!iso) return <span className="font-mono text-xs text-ink-2">—</span>;
  const d = new Date(iso);
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, "0");
  const D = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return (
    <span className="font-mono text-xs text-ink-2">
      {Y}/{M}/{D}
      <span className="text-ink-4">
        {" "}
        {h}:{m}
      </span>
    </span>
  );
}

export default function MyTicketsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const fetchTickets = async () => {
    if (!user) return;
    try {
      const data = await getMyTickets(user.accessToken);
      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const filtered = useMemo(
    () =>
      tickets
        .filter(
          (t) =>
            (!statusFilter || t.status === statusFilter) &&
            (!q ||
              t.title.includes(q) ||
              t.id.toLowerCase().includes(q.toLowerCase())),
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [tickets, statusFilter, q],
  );

  const counts = useMemo(
    () => ({
      total: tickets.length,
      pending: tickets.filter((t) => t.status === "PENDING").length,
      approved: tickets.filter((t) => t.status === "APPROVED").length,
      rejected: tickets.filter((t) => t.status === "REJECTED").length,
    }),
    [tickets],
  );

  const handleWithdraw = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (!confirm("この申請を取り下げますか？")) return;
    try {
      await withdrawTicket(user.accessToken, id);
      await fetchTickets();
    } catch (err) {
      alert(err instanceof Error ? err.message : "取り下げに失敗しました。");
    }
  };

  return (
    <div className="px-8 py-7 pb-16 max-w-[1240px]">
      <div className="flex items-end justify-between mb-[22px] gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight m-0 mb-1">
            マイチケット
          </h1>
          <p className="text-ink-3 text-[13px] m-0">
            自分が作成したすべての申請を確認できます。
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-ink bg-ink text-[#F4F2EC] font-medium text-[13px] transition-colors hover:bg-[#2A2A28]"
          onClick={() => router.push("/new-ticket")}
        >
          <Icon name="plus" size={14} /> 新規申請
        </button>
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
        </div>
        <div className="flex items-center gap-2 bg-bg-elev border border-line rounded px-2.5">
          <Icon name="search" size={14} className="text-ink-4" />
          <input
            className="border-none outline-none bg-transparent py-[7px] w-[220px] text-[13px]"
            placeholder="タイトル・IDで検索"
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
            <p className="m-0 text-[13px]">
              フィルタを変更するか、新規申請を作成してください。
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["タイトル", "種別", "ステータス", "申請日時", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className="text-left text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 font-medium px-3.5 py-2.5 border-b border-line bg-bg-subtle whitespace-nowrap"
                      style={
                        i === 1
                          ? { width: 200 }
                          : i === 2
                            ? { width: 120 }
                            : i === 3
                              ? { width: 140 }
                              : i === 4
                                ? { width: 110 }
                                : undefined
                      }
                    >
                      {h}
                    </th>
                  ),
                )}
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
                    <td className="px-3.5 py-[13px] text-[13.5px] align-middle">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11.5px] font-medium bg-bg-subtle text-ink-2 border border-line">
                        {typeInfo?.label ?? t.type}
                      </span>
                    </td>
                    <td className="px-3.5 py-[13px] align-middle">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-3.5 py-[13px] align-middle">
                      <DateCell iso={t.createdAt} />
                    </td>
                    <td
                      className="px-3.5 py-[13px] align-middle text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t.status === "PENDING" ? (
                        <button
                          className="inline-flex items-center gap-1.5 px-2.5 py-[5px] text-xs rounded border bg-bg-elev text-status-rejected-fg border-[oklch(0.85_0.06_25)] hover:bg-status-rejected-bg transition-colors"
                          onClick={(e) => handleWithdraw(t.id, e)}
                        >
                          取り下げ
                        </button>
                      ) : (
                        <Icon name="chevron" size={12} />
                      )}
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
