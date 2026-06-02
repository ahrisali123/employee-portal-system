"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMyTickets,
  updateTicket,
  getAttachmentDownloadUrl,
} from "@/lib/api";
import { TYPE_INDEX } from "@/lib/data";
import { Icon } from "@/components/Icon";
import { GroupedSelect } from "@/components/GroupedSelect";
import { ApproverPicker } from "@/components/ApproverPicker";
import { getApprovers } from "@/lib/api";
import type { Ticket, TicketType, Approver, TicketAttachment } from "@/types";

const inputCls =
  "w-full bg-bg-elev border border-line rounded py-[9px] px-3 text-ink outline-none transition-[border-color,box-shadow] duration-[0.12s] focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-bg)]";
const sectionNum = "font-mono text-[11px] text-ink-4 tracking-[0.06em]";

function fmtFileSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function ExistingAttachment({
  ticketId,
  attachment,
  token,
  onRemove,
}: {
  ticketId: string;
  attachment: TicketAttachment;
  token: string;
  onRemove: () => void;
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
    <div className="flex items-center gap-2 px-3 py-2 bg-bg-subtle border border-line rounded">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-2.5 flex-1 min-w-0 text-left bg-transparent border-none p-0 cursor-pointer"
      >
        <Icon name="download" size={13} className="text-ink-3 shrink-0" />
        <span className="text-[12.5px] text-ink truncate flex-1">
          {attachment.fileName}
        </span>
        {attachment.fileSize != null && (
          <span className="text-[11px] font-mono text-ink-4 shrink-0">
            {fmtFileSize(attachment.fileSize)}
          </span>
        )}
        <span className="text-[11px] font-mono text-ink-4 shrink-0 ml-1">
          {loading ? "取得中..." : "↓"}
        </span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="w-5 h-5 grid place-items-center text-ink-4 rounded-sm hover:bg-status-rejected-bg hover:text-status-rejected-fg border-none bg-transparent shrink-0"
        title="削除"
      >
        <Icon name="x" size={12} />
      </button>
    </div>
  );
}

export default function EditTicketPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [typeCode, setTypeCode] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [approverIds, setApproverIds] = useState<string[]>([""]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [description]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getMyTickets(user.accessToken),
      getApprovers(user.accessToken),
    ])
      .then(([tickets, approverList]) => {
        const found = tickets.find((t) => t.id === params.id);
        if (!found || found.status !== "REJECTED") {
          router.replace(`/tickets/${params.id}`);
          return;
        }
        setTicket(found);
        setTitle(found.title);
        setTypeCode(found.type);
        setDescription(found.description);
        setStartDate(found.startDate ?? "");
        setEndDate(found.endDate ?? "");
        setAmount(found.amount != null ? String(found.amount) : "");
        setDestination(found.destination ?? "");
        setApproverIds(
          found.approvals?.length
            ? found.approvals
                .sort((a, b) => a.stepOrder - b.stepOrder)
                .map((a) => a.approverId)
            : [""],
        );
        setApprovers(approverList);
      })
      .catch(() => {
        router.replace(`/tickets/${params.id}`);
      })
      .finally(() => setLoading(false));
  }, [user, params.id]);

  const typeInfo = typeCode ? TYPE_INDEX[typeCode] : null;
  const showAmount =
    typeInfo &&
    (typeInfo.categoryKey === "expense" ||
      typeInfo.code === "PURCHASE" ||
      typeInfo.code === "BUSINESS_TRIP" ||
      typeInfo.code === "TRAINING");
  const showDest = typeInfo?.code === "BUSINESS_TRIP";

  const setApprover = (i: number, id: string) => {
    const a = [...approverIds];
    a[i] = id;
    setApproverIds(a);
  };
  const addApprover = () => setApproverIds([...approverIds, ""]);
  const removeApprover = (i: number) => {
    if (approverIds.length <= 1) return;
    setApproverIds(approverIds.filter((_, idx) => idx !== i));
  };

  const valid =
    title.trim() && typeCode && approverIds.filter(Boolean).length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ticket || !valid) return;
    setSubmitting(true);
    setError("");
    try {
      const keepAttachmentIds = (ticket.attachments ?? [])
        .filter((a) => !removedIds.has(a.id))
        .map((a) => a.id);

      await updateTicket(
        user.accessToken,
        ticket.id,
        {
          type: typeCode as TicketType,
          title,
          description: description || "（記載なし）",
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          amount: amount ? Number(amount) : undefined,
          destination: destination || undefined,
          approvers: approverIds.filter(Boolean),
        },
        keepAttachmentIds,
        newFiles.length > 0 ? newFiles : undefined,
      );
      router.push(`/tickets/${ticket.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "修正の送信に失敗しました。",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-8 py-7">
        <p className="text-ink-3">読み込み中...</p>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="px-8 py-7 pb-16" style={{ maxWidth: 900 }}>
      <div className="mb-5">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded border-none bg-transparent text-ink-2 hover:bg-bg-hover transition-colors"
          onClick={() => router.back()}
        >
          ← 詳細へ戻る
        </button>
      </div>

      <div className="mb-[22px]">
        <h1 className="text-[22px] font-semibold tracking-tight m-0 mb-1">
          申請を修正して再申請
        </h1>
        <p className="text-ink-3 text-[13px] m-0">
          差し戻し理由を確認の上、内容を修正して再提出してください。
        </p>
      </div>

      {/* 差し戻しノート */}
      {ticket.approvals?.some((a) => a.status === "REJECTED" && a.note) && (
        <div className="mb-5 flex flex-col gap-2">
          {ticket.approvals
            .filter((a) => a.status === "REJECTED" && a.note)
            .map((a, i) => (
              <div
                key={i}
                className="px-4 py-3 bg-status-rejected-bg border border-[oklch(0.85_0.06_25)] rounded-sm border-l-2 border-l-status-rejected-dot"
              >
                <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-status-rejected-fg mb-1">
                  差し戻しコメント — {a.approverName}
                </div>
                <div className="text-[13px] text-ink-2 leading-[1.6]">
                  {a.note}
                </div>
              </div>
            ))}
        </div>
      )}

      {error && (
        <div className="mb-4 px-3 py-2.5 bg-status-rejected-bg border border-status-rejected-dot rounded text-[13px] text-status-rejected-fg">
          {error}
        </div>
      )}

      <form
        className="bg-bg-elev border border-line rounded shadow-card overflow-hidden"
        onSubmit={handleSubmit}
      >
        {/* セクション 01 */}
        <div className="px-[26px] py-[22px] border-b border-line">
          <div className="flex items-baseline gap-3 mb-4">
            <span className={sectionNum}>01</span>
            <h3 className="text-sm font-semibold m-0">基本情報</h3>
          </div>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            <div className="col-span-2">
              <label className="block text-xs font-medium text-ink-2 mb-1.5">
                タイトル{" "}
                <span className="text-[oklch(0.55_0.14_25)] ml-[3px]">*</span>
              </label>
              <input
                className={inputCls}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-ink-2 mb-1.5">
                種別{" "}
                <span className="text-[oklch(0.55_0.14_25)] ml-[3px]">*</span>
              </label>
              <GroupedSelect value={typeCode} onChange={setTypeCode} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-ink-2 mb-1.5">
                説明・理由
              </label>
              <textarea
                ref={descriptionRef}
                className={`${inputCls} resize-y`}
                style={{ minHeight: 96 }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* セクション 02 */}
        <div className="px-[26px] py-[22px] border-b border-line">
          <div className="flex items-baseline gap-3 mb-4">
            <span className={sectionNum}>02</span>
            <h3 className="text-sm font-semibold m-0">期間・金額・出張先</h3>
            <span className="ml-auto text-xs text-ink-4">
              該当する項目のみ入力
            </span>
          </div>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">
                開始日{" "}
                <span className="font-normal text-ink-4 ml-1 text-[11px]">
                  任意
                </span>
              </label>
              <input
                className={inputCls}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">
                終了日{" "}
                <span className="font-normal text-ink-4 ml-1 text-[11px]">
                  任意
                </span>
              </label>
              <input
                className={inputCls}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div style={{ opacity: showAmount ? 1 : 0.45 }}>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">
                金額{" "}
                <span className="font-normal text-ink-4 ml-1 text-[11px]">
                  経費・購買の場合
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 font-en">
                  ¥
                </span>
                <input
                  className={`${inputCls} pl-[26px] font-en`}
                  type="number"
                  placeholder="0"
                  disabled={!showAmount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div style={{ opacity: showDest ? 1 : 0.45 }}>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">
                出張先{" "}
                <span className="font-normal text-ink-4 ml-1 text-[11px]">
                  出張の場合
                </span>
              </label>
              <input
                className={inputCls}
                type="text"
                disabled={!showDest}
                placeholder="例：大阪市北区 / 大阪支社"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* セクション 03 — 添付資料 */}
        <div className="px-[26px] py-[22px] border-b border-line">
          <div className="flex items-baseline gap-3 mb-4">
            <span className={sectionNum}>03</span>
            <h3 className="text-sm font-semibold m-0">添付ファイル</h3>
            <span className="ml-auto text-xs text-ink-4">
              PDF / Word / 画像（各最大 10MB）
            </span>
          </div>

          {(() => {
            const visible = (ticket.attachments ?? []).filter(
              (a) => !removedIds.has(a.id),
            );
            if (visible.length === 0) return null;
            return (
              <div className="flex flex-col gap-1.5 mb-3">
                <div className="text-[11px] font-mono text-ink-4 uppercase tracking-[0.06em] mb-1">
                  現在の添付ファイル
                </div>
                {visible.map((att) => (
                  <ExistingAttachment
                    key={att.id}
                    ticketId={ticket.id}
                    attachment={att}
                    token={user!.accessToken}
                    onRemove={() =>
                      setRemovedIds(
                        (prev) => new Set(Array.from(prev).concat(att.id)),
                      )
                    }
                  />
                ))}
              </div>
            );
          })()}

          <div className="flex flex-col gap-2">
            {newFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 bg-bg-subtle border border-line rounded"
              >
                <Icon
                  name="download"
                  size={14}
                  className="text-ink-3 shrink-0"
                />
                <span className="text-[13px] text-ink truncate flex-1">
                  {f.name}
                </span>
                <span className="text-[11px] text-ink-4 font-mono shrink-0">
                  {fmtFileSize(f.size)}
                </span>
                <button
                  type="button"
                  className="w-5 h-5 grid place-items-center text-ink-4 rounded-sm hover:bg-bg-hover hover:text-ink border-none bg-transparent shrink-0"
                  onClick={() =>
                    setNewFiles(newFiles.filter((_, idx) => idx !== i))
                  }
                >
                  <Icon name="x" size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="w-full border border-dashed border-line-strong rounded px-3 py-4 flex flex-col items-center gap-1.5 text-ink-3 hover:bg-bg-subtle hover:border-ink-4 hover:text-ink transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon name="download" size={15} />
              <span className="text-[12.5px] font-medium">
                {newFiles.length > 0
                  ? "さらに追加"
                  : "クリックしてファイルを追加"}
              </span>
              <span className="text-[11px] text-ink-4">
                .pdf .doc .docx .jpg .png
              </span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            multiple
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              if (picked.length > 0)
                setNewFiles((prev) => [...prev, ...picked]);
              e.target.value = "";
            }}
          />
        </div>

        {/* セクション 04 — 承認者 */}
        <div className="px-[26px] py-[22px] border-b border-line">
          <div className="flex items-baseline gap-3 mb-4">
            <span className={sectionNum}>04</span>
            <h3 className="text-sm font-semibold m-0">承認者</h3>
            <span className="ml-auto text-xs text-ink-4">
              承認順に上から並べてください
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {approverIds.map((id, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-2 py-2 pr-2.5 bg-bg-subtle border border-line rounded"
              >
                <span className="w-[22px] h-[22px] rounded-full bg-bg-elev border border-line grid place-items-center font-mono text-[11px] font-semibold text-ink-2 shrink-0">
                  {i + 1}
                </span>
                <ApproverPicker
                  approvers={approvers}
                  value={id}
                  onChange={(v) => setApprover(i, v)}
                  excludeIds={approverIds
                    .filter((_, idx) => idx !== i)
                    .filter(Boolean)}
                />
                <button
                  type="button"
                  className="w-6 h-6 grid place-items-center text-ink-4 rounded-sm hover:bg-bg-hover hover:text-ink border-none bg-transparent"
                  onClick={() => removeApprover(i)}
                  disabled={approverIds.length <= 1}
                  style={{ opacity: approverIds.length <= 1 ? 0.3 : 1 }}
                >
                  <Icon name="x" size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="w-full bg-none border border-dashed border-line-strong px-3 py-2 rounded text-[12.5px] font-medium text-ink-2 hover:bg-bg-subtle hover:border-ink-4 hover:text-ink transition-colors"
              onClick={addApprover}
            >
              + 承認者を追加
            </button>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between px-[26px] py-4 bg-bg-subtle border-t border-line">
          <div className="text-xs text-ink-3">
            ※ 再提出後、承認フローが最初からやり直されます。
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-line bg-bg-elev text-ink font-medium text-[13px] hover:bg-bg-hover transition-colors"
              onClick={() => router.back()}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-ink bg-ink text-[#F4F2EC] font-medium text-[13px] hover:bg-[#2A2A28] transition-colors disabled:opacity-40"
              disabled={!valid || submitting}
            >
              <Icon name="check" size={14} />{" "}
              {submitting ? "送信中..." : "修正して再申請"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
