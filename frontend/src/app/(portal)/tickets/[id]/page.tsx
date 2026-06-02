"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMyTickets,
  getAllTickets,
  reviewTicket,
  withdrawTicket,
  getAttachmentDownloadUrl,
} from "@/lib/api";
import { TYPE_INDEX, fmtDate, fmtYen } from "@/lib/data";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar } from "@/components/Avatar";
import type { Ticket, TicketAttachment, ActivityType } from "@/types";

function activityConfig(action: ActivityType): {
  label: string;
  color: string;
} {
  switch (action) {
    case "CREATED":
      return { label: "申請を作成", color: "var(--ink)" };
    case "APPROVED":
      return { label: "承認", color: "var(--status-approved-dot)" };
    case "REJECTED":
      return { label: "差し戻し", color: "var(--status-rejected-dot)" };
    case "WITHDRAWN":
      return { label: "申請を取り下げ", color: "var(--status-withdrawn-dot)" };
    case "RESUBMITTED":
      return { label: "修正して再申請", color: "var(--status-pending-dot)" };
  }
}

function fmtFileSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function AttachmentRow({
  ticketId,
  attachment,
  token,
}: {
  ticketId: string;
  attachment: TicketAttachment;
  token: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const presignedUrl = await getAttachmentDownloadUrl(
        token,
        ticketId,
        attachment.id,
      );
      const res = await fetch(presignedUrl);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = attachment.fileName;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      alert("ダウンロードに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-bg-subtle border border-line rounded hover:bg-bg-hover transition-colors text-left"
      onClick={handleDownload}
      disabled={loading}
    >
      <Icon name="download" size={14} className="text-ink-3 shrink-0" />
      <span className="text-[13px] text-ink font-medium truncate flex-1">
        {attachment.fileName}
      </span>
      {attachment.fileSize != null && (
        <span className="text-[11px] font-mono text-ink-4 shrink-0">
          {fmtFileSize(attachment.fileSize)}
        </span>
      )}
      <span className="text-[11px] font-mono text-ink-4 shrink-0 ml-1">
        {loading ? "取得中..." : "ダウンロード"}
      </span>
    </button>
  );
}

export default function TicketDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(
    null,
  );
  const [note, setNote] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchTicket = async () => {
    if (!user) return;
    try {
      const data =
        user.activeRole === "ADMIN"
          ? await getAllTickets(user.accessToken)
          : await getMyTickets(user.accessToken);
      const found = data.find((t) => t.id === params.id);
      if (!found) setNotFound(true);
      else setTicket(found);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [user, params.id]);

  const handleReview = async (status: "APPROVED" | "REJECTED") => {
    if (!user || !ticket) return;
    setReviewing(true);
    try {
      await reviewTicket(user.accessToken, ticket.id, status, note);
      await fetchTicket();
      setDecision(null);
      setNote("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "レビューに失敗しました。");
    } finally {
      setReviewing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !ticket) return;
    if (!confirm("この申請を取り下げますか？")) return;
    setWithdrawing(true);
    try {
      await withdrawTicket(user.accessToken, ticket.id);
      router.push("/my-tickets");
    } catch (err) {
      alert(err instanceof Error ? err.message : "取り下げに失敗しました。");
      setWithdrawing(false);
    }
  };

  const thCls =
    "text-left text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 font-medium px-3.5 py-2.5 border-b border-line bg-bg-subtle whitespace-nowrap";

  if (loading)
    return (
      <div className="px-8 py-7">
        <p className="text-ink-3">読み込み中...</p>
      </div>
    );
  if (notFound || !ticket)
    return (
      <div className="px-8 py-7">
        <div className="py-16 text-center text-ink-3">
          <Icon name="inbox" size={20} />
          <h3 className="text-ink mt-2 mb-0 text-base font-semibold">
            チケットが見つかりません
          </h3>
          <p className="m-0 text-[13px]">
            削除されたか、アクセス権がない可能性があります。
          </p>
        </div>
      </div>
    );

  const typeInfo = TYPE_INDEX[ticket.type];
  const isOwner = user?.userId === ticket.userId;
  const myStepIndex =
    ticket.approvals?.findIndex((a) => a.approverId === user?.userId) ?? -1;
  const currentStepIndex =
    ticket.approvals?.findIndex((a) => a.status === "PENDING") ?? -1;
  const myStep =
    myStepIndex !== -1 ? ticket.approvals?.[myStepIndex] : undefined;
  const currentStep =
    currentStepIndex !== -1 ? ticket.approvals?.[currentStepIndex] : undefined;
  const canReview =
    user?.activeRole === "ADMIN" &&
    ticket.status === "PENDING" &&
    myStep !== undefined &&
    myStep.status === "PENDING" &&
    myStep.stepOrder === currentStep?.stepOrder;

  return (
    <div className="px-8 py-7 pb-16 max-w-[1240px]">
      <div className="mb-4">
        <button
          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded border-none bg-transparent text-ink-2 hover:bg-bg-hover transition-colors"
          onClick={() => router.back()}
        >
          ← 一覧へ戻る
        </button>
      </div>

      <div
        className="grid gap-[22px] items-start"
        style={{ gridTemplateColumns: "1fr 360px" }}
      >
        <div className="flex flex-col gap-4">
          <div className="bg-bg-elev border border-line rounded overflow-hidden shadow-card">
            <div className="px-[26px] py-6 border-b border-line flex flex-col gap-2.5">
              <div className="flex items-center gap-2 font-mono text-[11.5px] text-ink-3">
                <span>{typeInfo?.category ?? ""}</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-[-0.005em] m-0 leading-[1.35]">
                {ticket.title}
              </h1>
              <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                <StatusBadge status={ticket.status} />
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-medium bg-bg-subtle text-ink-2 border border-line">
                  {typeInfo?.label ?? ticket.type}
                </span>
              </div>
            </div>

            <div className="px-[22px] py-[18px]">
              <div
                className="grid gap-[18px_28px]"
                style={{ gridTemplateColumns: "repeat(2,1fr)" }}
              >
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 mb-1">
                    申請者
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Avatar name={ticket.userName} size={26} />
                    <div>
                      <div className="font-medium">{ticket.userName}</div>
                      <div className="text-xs text-ink-3">
                        {ticket.departmentName}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 mb-1">
                    申請日時
                  </div>
                  <div className="font-mono text-[13px]">
                    {fmtDate(ticket.createdAt, { withTime: true, slash: true })}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 mb-1">
                    開始日
                  </div>
                  <div className="font-mono text-[13px]">
                    {ticket.startDate
                      ? fmtDate(ticket.startDate, { slash: true })
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 mb-1">
                    終了日
                  </div>
                  <div className="font-mono text-[13px]">
                    {ticket.endDate
                      ? fmtDate(ticket.endDate, { slash: true })
                      : "—"}
                  </div>
                </div>
                {ticket.amount != null && (
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 mb-1">
                      金額
                    </div>
                    <div className="font-en font-medium tabular-nums text-sm">
                      {fmtYen(ticket.amount)}
                    </div>
                  </div>
                )}
                {ticket.destination && (
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 mb-1">
                      出張先
                    </div>
                    <div className="text-sm">{ticket.destination}</div>
                  </div>
                )}
                <div className="col-span-2">
                  <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 mb-1">
                    説明・理由
                  </div>
                  <div className="whitespace-pre-wrap bg-bg-subtle border border-line rounded px-4 py-3.5 text-[13.5px] leading-[1.7] text-ink-2">
                    {ticket.description || "（記載なし）"}
                  </div>
                </div>
                {ticket.attachments?.length > 0 && (
                  <div className="col-span-2">
                    <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 mb-1.5">
                      添付ファイル
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {ticket.attachments.map((att) => (
                        <AttachmentRow
                          key={att.id}
                          ticketId={ticket.id}
                          attachment={att}
                          token={user!.accessToken}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-bg-elev border border-line rounded overflow-hidden shadow-card">
            <div className="px-[22px] py-[18px] border-b border-line flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold m-0">承認ステップ</h3>
              <span className="text-[11px] font-mono text-ink-4 tracking-[0.06em]">
                {ticket.approvals?.filter((a) => a.status === "APPROVED")
                  .length ?? 0}{" "}
                / {ticket.approvals?.length ?? 0} 完了
              </span>
            </div>
            <div className="px-[22px] py-[18px]">
              <div className="flex flex-col">
                {(ticket.approvals ?? [])
                  .sort((a, b) => a.stepOrder - b.stepOrder)
                  .map((step, i, arr) => {
                    const isCurrent =
                      step.status === "PENDING" && i === currentStepIndex;
                    const isDone = step.status === "APPROVED";
                    const isRejected = step.status === "REJECTED";
                    const stepCls = `step-item${isDone ? " step-done" : isRejected ? " step-rejected" : ""}`;
                    return (
                      <div
                        key={i}
                        className={`grid gap-3 ${stepCls}`}
                        style={{ gridTemplateColumns: "36px 1fr" }}
                      >
                        <div
                          className={`w-7 h-7 rounded-full grid place-items-center font-mono text-[11px] font-semibold relative z-[1] ${isDone ? "bg-status-approved-dot text-white border-status-approved-dot border-[1.5px]" : isRejected ? "bg-status-rejected-dot text-white border-status-rejected-dot border-[1.5px]" : isCurrent ? "bg-bg-elev border-[1.5px] border-status-pending-dot text-status-pending-fg shadow-[0_0_0_3px_var(--status-pending-bg)]" : "bg-bg-elev text-ink-2 border-[1.5px] border-line-strong"}`}
                        >
                          {isDone ? (
                            <Icon name="check" size={12} />
                          ) : isRejected ? (
                            <Icon name="x" size={11} />
                          ) : (
                            i + 1
                          )}
                        </div>
                        <div className="pt-[3px]">
                          <div className="flex items-center gap-2 font-medium">
                            <Avatar name={step.approverName} size={22} />
                            <span className="text-[13.5px]">
                              {step.approverName}
                            </span>
                            <span className="text-ink-3 text-xs font-normal">
                              {step.approverDepartmentName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 mt-1 text-xs text-ink-3">
                            <StatusBadge status={step.status} />
                            {step.reviewedAt ? (
                              <span className="font-mono">
                                {fmtDate(step.reviewedAt, {
                                  withTime: true,
                                  slash: true,
                                })}
                              </span>
                            ) : (
                              <span className="text-ink-4">
                                {isCurrent ? "確認中" : "前の承認待ち"}
                              </span>
                            )}
                          </div>
                          {step.note && (
                            <div
                              className={`mt-2 px-3 py-2.5 bg-bg-subtle border border-line rounded-sm text-[13px] text-ink-2 leading-[1.6] border-l-2 ${isRejected ? "border-l-status-rejected-dot" : isDone ? "border-l-status-approved-dot" : "border-l-line-strong"}`}
                            >
                              {step.note}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sticky top-[72px]">
          {canReview && (
            <div className="bg-bg-elev border border-line rounded overflow-hidden shadow-card">
              <div className="px-[18px] py-3.5 bg-ink text-[#F4F2EC] flex justify-between items-center">
                <h3 className="text-[13px] m-0 font-semibold tracking-[0.02em]">
                  承認レビュー
                </h3>
                <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[rgba(244,242,236,0.5)]">
                  STEP {myStepIndex + 1} / {ticket.approvals?.length ?? 1}
                </span>
              </div>
              <div className="px-[18px] py-4 flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-2 mb-1.5">
                    コメント{" "}
                    <span className="text-ink-4 font-normal text-[11px]">
                      {decision === "REJECTED"
                        ? "（差し戻し理由を推奨）"
                        : "（任意）"}
                    </span>
                  </label>
                  <textarea
                    className="w-full bg-bg-elev border border-line rounded py-[9px] px-3 text-ink outline-none resize-y transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-bg)] text-[13px]"
                    style={{ minHeight: 80 }}
                    placeholder={
                      decision === "REJECTED"
                        ? "差し戻しの理由や修正依頼事項を記入してください"
                        : "差し戻しの理由や補足コメントを記入できます"
                    }
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: "1fr 1fr" }}
                >
                  <button
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded border bg-bg-elev text-status-rejected-fg border-[oklch(0.85_0.06_25)] hover:bg-status-rejected-bg text-[13px] font-medium transition-colors"
                    onClick={() => handleReview("REJECTED")}
                    disabled={reviewing}
                  >
                    <Icon name="refresh" size={14} /> 差し戻す
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded border border-ink bg-ink text-[#F4F2EC] text-[13px] font-medium hover:bg-[#2A2A28] transition-colors"
                    onClick={() => handleReview("APPROVED")}
                    disabled={reviewing}
                  >
                    <Icon name="check" size={14} /> 承認する
                  </button>
                </div>
              </div>
            </div>
          )}

          {(isOwner || user?.activeRole === "EMPLOYEE") &&
            ticket.status === "PENDING" && (
              <div className="bg-bg-elev border border-line rounded overflow-hidden shadow-card">
                <div className="px-[22px] py-[18px] flex flex-col gap-2.5">
                  <div className="text-[13px] font-medium">
                    この申請を取り下げますか？
                  </div>
                  <div className="text-xs text-ink-3 leading-[1.6]">
                    まだ承認待ちの状態のため、申請を取り下げることができます。取り下げ後は再申請が必要です。
                  </div>
                  <button
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded border bg-bg-elev text-status-rejected-fg border-[oklch(0.85_0.06_25)] hover:bg-status-rejected-bg text-[13px] font-medium transition-colors disabled:opacity-60"
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                  >
                    {withdrawing ? "処理中..." : "申請を取り下げる"}
                  </button>
                </div>
              </div>
            )}

          {isOwner && ticket.status === "REJECTED" && (
            <div className="bg-bg-elev border border-line rounded overflow-hidden shadow-card">
              <div
                className="px-[18px] py-3.5 flex justify-between items-center"
                style={{ background: "var(--status-rejected-fg)" }}
              >
                <h3 className="text-[13px] m-0 font-semibold text-[#F4F2EC]">
                  差し戻しされました
                </h3>
                <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[rgba(244,242,236,0.5)]">
                  ACTION REQUIRED
                </span>
              </div>
              <div className="px-[18px] py-4 flex flex-col gap-3">
                <div className="text-[12.5px] text-ink-3 leading-[1.7]">
                  承認者のコメントをご確認の上、申請内容を修正して再申請できます。
                </div>
                <button
                  className="w-full inline-flex items-center justify-center gap-1.5 py-[11px] px-3.5 rounded border border-ink bg-ink text-[#F4F2EC] font-medium text-[13px] hover:bg-[#2A2A28] transition-colors"
                  onClick={() => router.push(`/tickets/${ticket.id}/edit`)}
                >
                  <Icon name="edit" size={14} /> 申請を修正して再申請
                </button>
              </div>
            </div>
          )}

          <div className="bg-bg-elev border border-line rounded overflow-hidden shadow-card">
            <div className="px-[22px] py-[18px] border-b border-line flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold m-0">アクティビティ</h3>
              <span className="font-mono text-[11px] text-ink-4">
                {ticket.activities?.length ?? 0} 件
              </span>
            </div>
            <div className="px-[22px] py-[18px]">
              <ul className="list-none p-0 m-0 flex flex-col gap-3.5">
                {(ticket.activities ?? []).map((act) => {
                  const cfg = activityConfig(act.action);
                  return (
                    <li
                      key={act.id}
                      className="grid gap-2.5 text-[12.5px]"
                      style={{ gridTemplateColumns: "16px 1fr" }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0"
                        style={{ background: cfg.color }}
                      />
                      <div>
                        <div>
                          <span className="font-medium">{act.actorName}</span>{" "}
                          が{cfg.label}
                        </div>
                        {act.note && (
                          <div className="mt-1 px-2.5 py-1.5 bg-bg-subtle border border-line rounded-sm text-[12px] text-ink-2 leading-[1.55]">
                            {act.note}
                          </div>
                        )}
                        <div className="font-mono text-[11px] text-ink-4 mt-0.5">
                          {fmtDate(act.createdAt, {
                            withTime: true,
                            slash: true,
                          })}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
