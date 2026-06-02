"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getAllTickets } from "@/lib/api";
import { TYPE_INDEX, fmtYen } from "@/lib/data";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import type { Ticket } from "@/types";

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

export default function PendingTicketsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user) return;
    getAllTickets(user.accessToken)
      .then((data) => setTickets(data.filter((t) => t.status === "PENDING")))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(
    () =>
      tickets.filter(
        (t) =>
          !q ||
          t.title.includes(q) ||
          t.id.toLowerCase().includes(q.toLowerCase()),
      ),
    [tickets, q],
  );

  return (
    <div className="px-8 py-7 pb-16" style={{ maxWidth: 1400 }}>
      <div className="flex items-end justify-between mb-[22px] gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight m-0 mb-1">
            承認待ち
          </h1>
          <p className="text-ink-3 text-[13px] m-0">
            承認アクションが必要なチケット一覧。
          </p>
        </div>
      </div>

      <div
        className="grid gap-px bg-line border border-line rounded overflow-hidden mb-[22px]"
        style={{ gridTemplateColumns: "repeat(2,1fr)" }}
      >
        <div className="bg-bg-elev px-[18px] py-4 flex flex-col gap-1">
          <span className="text-[11px] font-mono text-ink-3 uppercase tracking-[0.06em]">
            承認待ち合計
          </span>
          <span className="font-en text-2xl font-semibold tracking-[-0.02em] flex items-baseline gap-1 text-status-pending-fg">
            {tickets.length}
            <small className="text-xs font-medium text-ink-3 font-jp">件</small>
          </span>
        </div>
        <div className="bg-bg-elev px-[18px] py-4 flex flex-col gap-1">
          <span className="text-[11px] font-mono text-ink-3 uppercase tracking-[0.06em]">
            表示中
          </span>
          <span className="font-en text-2xl font-semibold tracking-[-0.02em] flex items-baseline gap-1">
            {filtered.length}
            <small className="text-xs font-medium text-ink-3 font-jp">件</small>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3.5 flex-wrap">
        <div />
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
              承認待ちのチケットはありません
            </h3>
            <p className="m-0 text-[13px]">すべての申請が処理済みです。</p>
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
