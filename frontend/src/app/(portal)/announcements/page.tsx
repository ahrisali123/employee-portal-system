"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ANNOUNCEMENT_CATEGORIES,
  ANN_CAT_INDEX,
  fmtRelative,
} from "@/lib/data";
import { getAnnouncements } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { SeverityBadge } from "@/components/StatusBadge";
import type { Announcement } from "@/types";

function sortPriority(a: Announcement): number {
  if (!a.ownAnnouncement && a.requiresAcknowledge && !a.acknowledged) return 0;
  if (!a.ownAnnouncement && !a.requiresAcknowledge && !a.opened) return 1;
  return 2;
}

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user) return;
    getAnnouncements(user.accessToken)
      .then(setAnnouncements)
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(
    () =>
      announcements
        .filter((a) => {
          if (catFilter && a.category !== catFilter) return false;
          if (
            showUnreadOnly &&
            (a.ownAnnouncement ||
              (a.requiresAcknowledge ? a.acknowledged : a.opened))
          )
            return false;
          if (q && !a.title.includes(q) && !a.content.includes(q)) return false;
          return true;
        })
        .sort((a, b) => {
          const pd = sortPriority(a) - sortPriority(b);
          if (pd !== 0) return pd;
          return (
            new Date(b.publishedAt ?? b.createdAt).getTime() -
            new Date(a.publishedAt ?? a.createdAt).getTime()
          );
        }),
    [announcements, catFilter, showUnreadOnly, q],
  );

  const unreadCount = announcements.filter(
    (a) =>
      !a.ownAnnouncement &&
      (a.requiresAcknowledge ? !a.acknowledged : !a.opened),
  ).length;
  const mustConfirmCount = announcements.filter(
    (a) => a.requiresAcknowledge,
  ).length;
  const thisMonth = announcements.filter((a) => {
    const d = new Date(a.publishedAt ?? a.createdAt);
    return (
      d.getMonth() === new Date().getMonth() &&
      d.getFullYear() === new Date().getFullYear()
    );
  }).length;

  return (
    <div className="px-8 py-7 pb-16 max-w-[1240px]">
      <div className="flex items-end justify-between mb-[22px] gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight m-0 mb-1">
            お知らせ
          </h1>
          <p className="text-ink-3 text-[13px] m-0">
            {user?.activeRole === "ADMIN"
              ? "全社員向けのお知らせを管理します。"
              : "社内からの重要なお知らせをご確認ください。"}
          </p>
        </div>
        {user?.activeRole === "ADMIN" && (
          <button
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-ink bg-ink text-[#F4F2EC] font-medium text-[13px] hover:bg-[#2A2A28] transition-colors"
            onClick={() => router.push("/announcements/new")}
          >
            <Icon name="plus" size={14} /> 新規お知らせ
          </button>
        )}
      </div>

      <div
        className="grid gap-px bg-line border border-line rounded overflow-hidden mb-[22px]"
        style={{ gridTemplateColumns: "repeat(4,1fr)" }}
      >
        {[
          { label: "合計", val: announcements.length, color: "" },
          { label: "確認必須", val: mustConfirmCount, color: "" },
          {
            label: "未確認",
            val: unreadCount,
            color: unreadCount > 0 ? "text-status-rejected-fg" : "text-ink-3",
          },
          { label: "今月", val: thisMonth, color: "" },
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
            <button
              className={`border-none px-[11px] py-1.5 text-xs border-r border-line transition-colors ${!catFilter ? "bg-ink text-[#F4F2EC]" : "bg-transparent text-ink-3 hover:bg-bg-hover hover:text-ink"}`}
              onClick={() => setCatFilter(null)}
            >
              すべて
            </button>
            {ANNOUNCEMENT_CATEGORIES.map((c) => (
              <button
                key={c.key}
                className={`border-none px-[11px] py-1.5 text-xs border-r border-line last:border-r-0 transition-colors ${catFilter === c.key ? "bg-ink text-[#F4F2EC]" : "bg-transparent text-ink-3 hover:bg-bg-hover hover:text-ink"}`}
                onClick={() => setCatFilter(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
          {user?.activeRole !== "ADMIN" && (
            <label className="flex items-center gap-1.5 text-xs text-ink-2 px-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
              />
              未確認のみ
            </label>
          )}
        </div>
        <div className="flex items-center gap-2 bg-bg-elev border border-line rounded px-2.5">
          <Icon name="search" size={14} className="text-ink-4" />
          <input
            className="border-none outline-none bg-transparent py-[7px] w-[220px] text-[13px]"
            placeholder="タイトル・本文で検索"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-ink-3 text-[13px]">
          読み込み中...
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.length === 0 ? (
            <div className="bg-bg-elev border border-line rounded overflow-hidden shadow-card">
              <div className="py-16 text-center text-ink-3">
                <h3 className="text-ink mt-2 mb-0 text-base font-semibold">
                  該当するお知らせがありません
                </h3>
                <p className="m-0 text-[13px]">
                  フィルタを変更してご確認ください。
                </p>
              </div>
            </div>
          ) : (
            filtered.map((a) => {
              const unread =
                !a.ownAnnouncement &&
                (a.requiresAcknowledge ? !a.acknowledged : !a.opened);
              const cat = ANN_CAT_INDEX[a.category];
              const deptLabel =
                a.targetDepartments.length === 0
                  ? "全社"
                  : a.targetDepartments.map((d) => d.name).join(" / ");
              const isDraft = a.status === "DRAFT";
              return (
                <button
                  key={a.id}
                  className={`grid gap-4 px-[22px] py-[18px] pl-[18px] bg-bg-elev border border-line rounded text-left cursor-pointer transition-[background,border-color,transform] shadow-card font-jp text-ink w-full hover:bg-bg-subtle hover:border-line-strong ${unread ? "bg-[oklch(0.985_0.012_75)] border-l-[3px] border-l-status-pending-dot pl-4" : ""} ${isDraft ? "opacity-70 border-dashed" : ""}`}
                  style={{ gridTemplateColumns: "80px 1fr" }}
                  onClick={() => router.push(`/announcements/${a.id}`)}
                >
                  <div className="flex flex-col items-start gap-1.5 pt-1">
                    <SeverityBadge severity={a.priority} readStatus={unread} />
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-medium bg-bg-subtle text-ink-2 border border-line">
                        {cat?.label}
                      </span>
                      {a.requiresAcknowledge && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-status-rejected-fg bg-status-rejected-bg px-2 py-0.5 rounded-full tracking-[0.02em]">
                          <Icon name="check" size={11} /> 確認必須
                        </span>
                      )}
                      {isDraft && (
                        <span className="text-[10.5px] font-mono uppercase tracking-[0.06em] text-ink-3 bg-bg-subtle px-2 py-0.5 rounded-full border border-dashed border-line-strong">
                          下書き
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-ink-4 tracking-[0.02em]">
                        {deptLabel}
                      </span>
                      <span className="ml-auto text-[11.5px] text-ink-4 font-mono">
                        {fmtRelative(a.publishedAt ?? a.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold m-0 mb-0.5 tracking-[-0.005em] leading-[1.4] text-ink">
                      {a.title}
                    </h3>
                    <p className="ann-snippet m-0 text-[13px] text-ink-3 leading-[1.6]">
                      {a.content.split("\n")[0]}
                    </p>
                    <div className="flex items-center gap-3.5 mt-1 text-xs text-ink-3">
                      {a.attachments.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11.5px] text-ink-3">
                          <Icon name="clip" size={12} /> 添付{" "}
                          {a.attachments.length}
                        </span>
                      )}
                      {user?.activeRole === "ADMIN" &&
                        a.requiresAcknowledge && (
                          <span className="text-[11.5px] text-ink-3 font-mono">
                            確認 {a.acknowledgedCount} 名
                          </span>
                        )}
                      {unread && (
                        <span className="ml-auto text-xs font-semibold text-status-rejected-fg">
                          確認する →
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
