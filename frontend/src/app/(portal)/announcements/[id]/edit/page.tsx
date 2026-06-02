"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ANNOUNCEMENT_CATEGORIES, SEVERITY, SEVERITY_ORDER } from "@/lib/data";
import { getAnnouncement, getDepartments, updateAnnouncement } from "@/lib/api";
import { Icon } from "@/components/Icon";
import type { AnnouncementAttachment, AnnouncementDepartment } from "@/types";

interface FormState {
  title: string;
  content: string;
  category: string;
  priority: string;
  targetDepartmentIds: string[];
  requiresAcknowledge: boolean;
}

const sectionHead = "flex items-baseline gap-3 mb-4";
const sectionNum = "font-mono text-[11px] text-ink-4 tracking-[0.06em]";
const sectionTitle = "text-sm font-semibold m-0";
const fieldLabel = "block text-xs font-medium text-ink-2 mb-1.5";
const inputCls =
  "w-full bg-bg-elev border border-line rounded py-[9px] px-3 text-ink outline-none transition-[border-color,box-shadow] duration-[0.12s] focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-bg)]";
const req = "text-[oklch(0.55_0.14_25)] ml-[3px]";
const opt = "font-normal text-ink-4 ml-1 text-[11px]";

export default function AnnouncementEditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    title: "",
    content: "",
    category: "general",
    priority: "NORMAL",
    targetDepartmentIds: [],
    requiresAcknowledge: false,
  });
  const [existingAttachments, setExistingAttachments] = useState<AnnouncementAttachment[]>([]);
  const [keepAttachmentIds, setKeepAttachmentIds] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [departments, setDepartments] = useState<AnnouncementDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getAnnouncement(user.accessToken, params.id),
      getDepartments(user.accessToken),
    ]).then(([ann, depts]) => {
      if (!ann.ownAnnouncement || ann.status !== "DRAFT") {
        router.replace(`/announcements/${params.id}`);
        return;
      }
      setForm({
        title: ann.title,
        content: ann.content,
        category: ann.category,
        priority: ann.priority,
        targetDepartmentIds: ann.targetDepartments.map((d) => d.id),
        requiresAcknowledge: ann.requiresAcknowledge,
      });
      setExistingAttachments(ann.attachments);
      setKeepAttachmentIds(ann.attachments.map((a) => a.id));
      setDepartments(depts);
    }).catch(() => router.replace("/announcements"))
      .finally(() => setLoading(false));
  }, [user, params.id]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleDept = (id: string) => {
    setForm((f) => {
      const has = f.targetDepartmentIds.includes(id);
      return {
        ...f,
        targetDepartmentIds: has
          ? f.targetDepartmentIds.filter((x) => x !== id)
          : [...f.targetDepartmentIds, id],
      };
    });
  };

  const removeExisting = (id: string) =>
    setKeepAttachmentIds((prev) => prev.filter((x) => x !== id));

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setNewFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeNew = (i: number) =>
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i));

  const valid = form.title.trim() && form.content.trim();

  const handleSubmit = async (publish: boolean) => {
    if (!valid || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateAnnouncement(
        user.accessToken,
        params.id,
        {
          title: form.title,
          content: form.content,
          category: form.category,
          priority: form.priority,
          requiresAcknowledge: form.requiresAcknowledge,
          targetDepartmentIds: form.targetDepartmentIds,
          keepAttachmentIds,
          publish,
        },
        newFiles.length > 0 ? newFiles : undefined,
      );
      router.push(`/announcements/${params.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "更新に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="px-8 py-7 text-ink-3 text-[13px]">読み込み中...</div>;
  }

  return (
    <div className="px-8 py-7 pb-16" style={{ maxWidth: 880 }}>
      <div className="flex items-end justify-between mb-[22px] gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight m-0 mb-1">
            お知らせを編集
          </h1>
          <p className="text-ink-3 text-[13px] m-0">
            下書きを編集して保存または公開できます。
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-status-rejected-bg text-status-rejected-fg rounded border border-status-rejected-dot text-[13px]">
          {error}
        </div>
      )}

      <div className="bg-bg-elev border border-line rounded shadow-card overflow-hidden">
        <div className="px-[26px] py-[22px] border-b border-line">
          <div className={sectionHead}>
            <span className={sectionNum}>01</span>
            <h3 className={sectionTitle}>本文</h3>
            <span className="ml-auto text-xs text-ink-4">タイトルと内容を入力</span>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="col-span-2">
              <label className={fieldLabel}>タイトル <span className={req}>*</span></label>
              <input
                className={inputCls}
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className={fieldLabel}>内容 <span className={req}>*</span></label>
              <textarea
                className={`${inputCls} resize-y`}
                style={{ minHeight: 160 }}
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="px-[26px] py-[22px] border-b border-line">
          <div className={sectionHead}>
            <span className={sectionNum}>02</span>
            <h3 className={sectionTitle}>分類と重要度</h3>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <label className={fieldLabel}>カテゴリ <span className={req}>*</span></label>
              <select
                className={`${inputCls} select-field`}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {ANNOUNCEMENT_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={fieldLabel}>重要度 <span className={req}>*</span></label>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
                {SEVERITY_ORDER.map((k) => {
                  const s = SEVERITY[k];
                  const active = form.priority === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => set("priority", k)}
                      className={`inline-flex items-center justify-center gap-1.5 px-1.5 py-2 bg-bg-elev border border-line rounded text-[12.5px] font-medium text-ink-2 cursor-pointer transition-colors hover:bg-bg-hover ${active ? "font-semibold" : ""}`}
                      style={active ? { background: s.bg, color: s.fg, borderColor: s.dot } : {}}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="px-[26px] py-[22px] border-b border-line">
          <div className={sectionHead}>
            <span className={sectionNum}>03</span>
            <h3 className={sectionTitle}>対象部署</h3>
            <span className="ml-auto text-xs text-ink-4">未選択の場合は全社対象</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => set("targetDepartmentIds", [])}
              className={`inline-flex items-center gap-[5px] px-3 py-[7px] border border-line bg-bg-elev rounded-full text-[12.5px] font-semibold cursor-pointer transition-colors hover:bg-bg-hover hover:border-line-strong hover:text-ink ${form.targetDepartmentIds.length === 0 ? "bg-ink text-[#F4F2EC] border-ink font-medium" : ""}`}
            >
              {form.targetDepartmentIds.length === 0 && <Icon name="check" size={11} />}
              全社
            </button>
            {departments.map((d) => {
              const active = form.targetDepartmentIds.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDept(d.id)}
                  className={`inline-flex items-center gap-[5px] px-3 py-[7px] border border-line bg-bg-elev rounded-full text-[12.5px] font-semibold cursor-pointer transition-colors hover:bg-bg-hover hover:border-line-strong hover:text-ink ${active ? "bg-ink text-[#F4F2EC] border-ink font-medium" : ""}`}
                >
                  {active && <Icon name="check" size={11} />}
                  {d.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-[26px] py-[22px] border-b border-line">
          <div className={sectionHead}>
            <span className={sectionNum}>04</span>
            <h3 className={sectionTitle}>確認設定・添付ファイル</h3>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="col-span-2">
              <label
                className="flex items-start gap-3 p-4 bg-bg-subtle border border-line rounded cursor-pointer"
                onClick={() => set("requiresAcknowledge", !form.requiresAcknowledge)}
              >
                <div className={`relative w-[34px] h-5 rounded-full transition-colors shrink-0 mt-0.5 ${form.requiresAcknowledge ? "bg-ink" : "bg-line-strong"}`}>
                  <span className={`toggle-knob absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm ${form.requiresAcknowledge ? "translate-x-3.5" : ""}`} />
                </div>
                <span className="flex flex-col">
                  <span className="font-medium">確認必須にする</span>
                  <span className="text-[11.5px] text-ink-3">
                    対象者全員が「確認しました」をクリックするまで未読として扱われます。
                  </span>
                </span>
              </label>
            </div>
            <div className="col-span-2">
              <label className={fieldLabel}>添付ファイル <span className={opt}>任意</span></label>
              <div className="flex flex-col gap-1.5">
                {existingAttachments.map((att) => {
                  const kept = keepAttachmentIds.includes(att.id);
                  return (
                    <div
                      key={att.id}
                      className={`flex items-center gap-2.5 px-3 py-2.5 bg-bg-subtle border border-line rounded-sm text-[13px] transition-opacity ${kept ? "" : "opacity-40"}`}
                    >
                      <Icon name="file" size={14} />
                      <span className="font-medium">{att.fileName}</span>
                      {att.fileSize != null && (
                        <span className="font-mono text-[11px] text-ink-4">
                          {att.fileSize < 1024 * 1024
                            ? `${Math.round(att.fileSize / 1024)} KB`
                            : `${(att.fileSize / 1024 / 1024).toFixed(1)} MB`}
                        </span>
                      )}
                      <button
                        type="button"
                        className="ml-auto w-6 h-6 grid place-items-center text-ink-4 rounded-sm hover:bg-bg-hover hover:text-ink"
                        onClick={() => kept ? removeExisting(att.id) : setKeepAttachmentIds((p) => [...p, att.id])}
                      >
                        <Icon name={kept ? "x" : "plus"} size={12} />
                      </button>
                    </div>
                  );
                })}
                {newFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 bg-bg-subtle border border-line rounded-sm text-[13px]">
                    <Icon name="file" size={14} />
                    <span className="font-medium">{f.name}</span>
                    <span className="font-mono text-[11px] text-ink-4">
                      {f.size < 1024 * 1024
                        ? `${Math.round(f.size / 1024)} KB`
                        : `${(f.size / 1024 / 1024).toFixed(1)} MB`}
                    </span>
                    <button
                      type="button"
                      className="ml-auto w-6 h-6 grid place-items-center text-ink-4 rounded-sm hover:bg-bg-hover hover:text-ink"
                      onClick={() => removeNew(i)}
                    >
                      <Icon name="x" size={12} />
                    </button>
                  </div>
                ))}
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilePick} />
                <button
                  type="button"
                  className="w-full bg-none border border-dashed border-line-strong px-3 py-2 rounded text-[12.5px] font-medium text-ink-2 hover:bg-bg-subtle hover:border-ink-4 hover:text-ink transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  + ファイルを追加
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-[26px] py-4 bg-bg-subtle border-t border-line">
          <div className="text-xs text-ink-3">※ 公開後は対象部署の全社員に通知されます。</div>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-line bg-bg-elev text-ink font-medium text-[13px] hover:bg-bg-hover transition-colors"
              onClick={() => router.back()}
            >
              キャンセル
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-line bg-bg-elev text-ink font-medium text-[13px] hover:bg-bg-hover transition-colors disabled:opacity-40"
              disabled={!valid || submitting}
              onClick={() => handleSubmit(false)}
            >
              下書き保存
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-ink bg-ink text-[#F4F2EC] font-medium text-[13px] hover:bg-[#2A2A28] transition-colors disabled:opacity-40"
              disabled={!valid || submitting}
              onClick={() => handleSubmit(true)}
            >
              <Icon name="check" size={14} /> {submitting ? "処理中..." : "公開する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
