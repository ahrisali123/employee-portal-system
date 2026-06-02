"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createTicket, generateTicket, getApprovers } from "@/lib/api";
import { TYPE_INDEX } from "@/lib/data";
import { Icon } from "@/components/Icon";
import { GroupedSelect } from "@/components/GroupedSelect";
import { ApproverPicker } from "@/components/ApproverPicker";
import type { TicketType, Approver } from "@/types";

interface FormState {
  title: string;
  typeCode: string;
  description: string;
  startDate: string;
  endDate: string;
  amount: string;
  destination: string;
  approverIds: string[];
  attachmentFiles: File[];
}

interface AiPreview {
  title: string | null;
  typeCode: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  amount: number | null;
  destination: string | null;
}

const AI_EXAMPLES = [
  "来週月曜から3日間、家族旅行のため有給休暇を取得したい",
  "5月20日に発生した本番障害対応の残業申請。21時まで対応",
  "27インチの4Kモニター 1台 約7万円を購入したい。開発作業効率化のため",
  "6月10日〜11日、福岡支社の顧客打ち合わせで出張。新幹線・宿泊込みで約65,000円",
];

const inputCls =
  "w-full bg-bg-elev border border-line rounded py-[9px] px-3 text-ink outline-none transition-[border-color,box-shadow] duration-[0.12s] focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-bg)]";
const sectionNum = "font-mono text-[11px] text-ink-4 tracking-[0.06em]";

function AiPreviewModal({
  preview,
  prompt,
  onApply,
  onClose,
  onRegen,
}: {
  preview: AiPreview;
  prompt: string;
  onApply: () => void;
  onClose: () => void;
  onRegen: () => void;
}) {
  const type = preview.typeCode ? TYPE_INDEX[preview.typeCode] : null;
  const rows = [
    { key: "title", label: "タイトル", value: preview.title, populated: true },
    {
      key: "type",
      label: "種別",
      value: type ? `${type.category} / ${type.label}` : null,
      populated: !!type,
    },
    {
      key: "description",
      label: "説明・理由",
      value: preview.description,
      populated: true,
      block: true,
    },
    {
      key: "startDate",
      label: "開始日",
      value: preview.startDate,
      populated: false,
      hint: "AIでは自動入力されません",
    },
    {
      key: "endDate",
      label: "終了日",
      value: preview.endDate,
      populated: false,
      hint: "AIでは自動入力されません",
    },
    {
      key: "amount",
      label: "金額",
      value:
        preview.amount != null
          ? `¥ ${Number(preview.amount).toLocaleString()}`
          : null,
      populated: true,
    },
    {
      key: "destination",
      label: "出張先",
      value: preview.destination,
      populated: true,
    },
  ];
  const filledCount = rows.filter(
    (r) => r.populated && r.value != null && r.value !== "",
  ).length;

  return (
    <div
      className="fixed inset-0 bg-[rgba(20,18,10,0.42)] backdrop-blur-[2px] grid place-items-center z-50 p-6 animate-modal-fade"
      onClick={onClose}
    >
      <div
        className="bg-bg-elev border border-line rounded-lg shadow-[0_24px_64px_rgba(20,18,10,0.22),0_2px_6px_rgba(20,18,10,0.08)] max-w-[640px] w-full max-h-[calc(100vh-48px)] flex flex-col overflow-hidden animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-[22px] pb-[18px] border-b border-line flex items-start justify-between gap-3.5">
          <div>
            <div className="inline-flex items-center gap-[5px] font-mono text-[10.5px] tracking-[0.08em] uppercase text-accent mb-1.5">
              <Icon name="sparkle" size={11} /> AI生成プレビュー
            </div>
            <h2 className="text-[17px] font-semibold m-0 mb-1 tracking-[-0.005em] leading-[1.4]">
              このドラフトをフォームに適用しますか？
            </h2>
            <p className="m-0 text-ink-3 text-[12.5px]">
              {filledCount}{" "}
              項目が自動入力されます。適用後はフォームで編集可能です。
            </p>
          </div>
          <button
            className="w-7 h-7 grid place-items-center rounded-sm text-ink-3 hover:bg-bg-hover hover:text-ink border-none bg-transparent shrink-0"
            onClick={onClose}
            aria-label="閉じる"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="px-6 py-[18px] overflow-y-auto flex flex-col gap-4">
          <div className="flex flex-col gap-1 px-3.5 py-3 bg-bg-subtle border border-line border-l-2 border-l-accent rounded-sm">
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-ink-4">
              入力プロンプト
            </span>
            <div className="text-[12.5px] text-ink-2 leading-[1.55] whitespace-pre-wrap">
              {prompt}
            </div>
          </div>

          <div
            className="grid gap-px bg-line border border-line rounded overflow-hidden"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            {rows.map((r) => {
              const empty = r.value == null || r.value === "";
              return (
                <div
                  key={r.key}
                  className={`bg-bg-elev px-3.5 py-3 flex flex-col gap-[5px] ${r.block ? "col-span-2" : ""} ${!r.populated ? "[background:repeating-linear-gradient(135deg,var(--bg-elev)_0_8px,var(--bg-subtle)_8px_9px)]" : ""}`}
                >
                  <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 flex items-center gap-1.5">
                    {r.label}
                    {!r.populated && (
                      <span className="font-jp text-[9.5px] font-semibold tracking-[0.04em] text-ink-4 bg-bg-subtle border border-line px-1.5 py-px rounded-full inline-flex items-center gap-[3px]">
                        手動入力
                      </span>
                    )}
                    {r.populated && !empty && (
                      <span className="font-jp text-[9.5px] font-semibold tracking-[0.04em] text-status-approved-fg bg-status-approved-bg px-1.5 py-px rounded-full inline-flex items-center gap-[3px]">
                        <Icon name="check" size={10} /> 自動入力
                      </span>
                    )}
                  </div>
                  <div className="text-[13.5px] text-ink leading-[1.6] whitespace-pre-wrap break-words">
                    {empty ? (
                      <span className="text-xs italic text-ink-4">
                        {(r as any).hint || "（推定なし）"}
                      </span>
                    ) : (
                      r.value
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-line bg-bg-subtle flex items-center justify-between gap-2">
          <button
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border-none bg-transparent text-ink-2 hover:bg-bg-hover text-[13px] font-medium transition-colors"
            onClick={onRegen}
            type="button"
          >
            <Icon name="refresh" size={13} /> 再生成
          </button>
          <div className="flex gap-2">
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-line bg-bg-elev text-ink font-medium text-[13px] hover:bg-bg-hover transition-colors"
              onClick={onClose}
              type="button"
            >
              キャンセル
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-ink bg-ink text-[#F4F2EC] font-medium text-[13px] hover:bg-[#2A2A28] transition-colors"
              onClick={onApply}
              type="button"
            >
              <Icon name="check" size={13} /> フォームに適用
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewTicketPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getApprovers(user.accessToken)
      .then(setApprovers)
      .catch(() => {});
  }, [user]);

  const [form, setForm] = useState<FormState>({
    title: "",
    typeCode: "",
    description: "",
    startDate: "",
    endDate: "",
    amount: "",
    destination: "",
    approverIds: [""],
    attachmentFiles: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<AiPreview | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [form.description]);

  const set = (k: keyof FormState, v: string | string[] | File[]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const typeInfo = form.typeCode ? TYPE_INDEX[form.typeCode] : null;
  const showAmount =
    typeInfo &&
    (typeInfo.categoryKey === "expense" ||
      typeInfo.code === "PURCHASE" ||
      typeInfo.code === "BUSINESS_TRIP" ||
      typeInfo.code === "TRAINING");
  const showDest = typeInfo?.code === "BUSINESS_TRIP";

  const setApprover = (i: number, id: string) => {
    const a = [...form.approverIds];
    a[i] = id;
    set("approverIds", a);
  };
  const addApprover = () => set("approverIds", [...form.approverIds, ""]);
  const removeApprover = (i: number) => {
    if (form.approverIds.length <= 1) return;
    set(
      "approverIds",
      form.approverIds.filter((_, idx) => idx !== i),
    );
  };

  const valid =
    form.title.trim() &&
    form.typeCode &&
    form.approverIds.filter(Boolean).length > 0;

  const runGenerate = async () => {
    const p = aiPrompt.trim();
    if (!p || aiLoading || !user) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await generateTicket(user.accessToken, p);
      setAiPreview({
        title: result?.title ?? null,
        typeCode: result?.type ?? null,
        description: result?.description ?? null,
        startDate: result?.startDate ?? null,
        endDate: result?.endDate ?? null,
        amount: result?.amount ?? null,
        destination: result?.destination ?? null,
      });
    } catch (e) {
      setAiError(
        e instanceof Error
          ? e.message
          : "生成に失敗しました。もう一度お試しください。",
      );
    } finally {
      setAiLoading(false);
    }
  };

  const applyPreview = () => {
    if (!aiPreview) return;
    setForm((f) => ({
      ...f,
      title: aiPreview.title ?? "",
      typeCode: aiPreview.typeCode ?? "",
      description: aiPreview.description ?? "",
      amount: aiPreview.amount != null ? String(aiPreview.amount) : "",
      destination: aiPreview.destination ?? "",
    }));
    setAiPreview(null);
    setAiPrompt("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !valid) return;
    setSubmitting(true);
    setError("");
    try {
      await createTicket(
        user.accessToken,
        {
          type: form.typeCode as TicketType,
          title: form.title,
          description: form.description || "（記載なし）",
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          amount: form.amount ? Number(form.amount) : undefined,
          destination: form.destination || undefined,
          approvers: form.approverIds.filter(Boolean),
        },
        form.attachmentFiles.length > 0 ? form.attachmentFiles : undefined,
      );
      router.push("/my-tickets");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "申請の提出に失敗しました。",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-8 py-7 pb-16" style={{ maxWidth: 1270 }}>
      <div className="flex items-end justify-between mb-[22px] gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight m-0 mb-1">
            新規申請
          </h1>
          <p className="text-ink-3 text-[13px] m-0">
            フォームに必要事項を入力し、承認者を指定して提出してください。
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2.5 bg-status-rejected-bg border border-status-rejected-dot rounded text-[13px] text-status-rejected-fg">
          {error}
        </div>
      )}

      <div className="flex items-start gap-4">
        <form
          className="w-[55%] bg-bg-elev border border-line rounded shadow-card overflow-hidden"
          onSubmit={submit}
        >
          {/* セクション 01 */}
          <div className="px-[26px] py-[22px] border-b border-line">
            <div className="flex items-baseline gap-3 mb-4">
              <span className={sectionNum}>01</span>
              <h3 className="text-sm font-semibold m-0">基本情報</h3>
              <span className="ml-auto text-xs text-ink-4">
                必須項目を入力してください
              </span>
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
                  placeholder="例：夏季休暇取得申請"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink-2 mb-1.5">
                  種別{" "}
                  <span className="text-[oklch(0.55_0.14_25)] ml-[3px]">*</span>
                </label>
                <GroupedSelect
                  value={form.typeCode}
                  onChange={(v) => set("typeCode", v)}
                />
                <div className="mt-1 text-[11.5px] text-ink-4">
                  申請内容のカテゴリと種別を選択します。
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink-2 mb-1.5">
                  説明・理由
                </label>
                <textarea
                  ref={descriptionRef}
                  className={`${inputCls} resize-y`}
                  style={{ minHeight: 96 }}
                  placeholder="申請の詳細・理由を記入してください。"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
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
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
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
                  value={form.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
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
                    value={form.amount}
                    onChange={(e) => set("amount", e.target.value)}
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
                  value={form.destination}
                  onChange={(e) => set("destination", e.target.value)}
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
            <div className="flex flex-col gap-2">
              {form.attachmentFiles.map((f, i) => (
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
                    {(f.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    type="button"
                    className="w-5 h-5 grid place-items-center text-ink-4 rounded-sm hover:bg-bg-hover hover:text-ink border-none bg-transparent shrink-0"
                    onClick={() =>
                      set(
                        "attachmentFiles",
                        form.attachmentFiles.filter((_, idx) => idx !== i),
                      )
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
                  {form.attachmentFiles.length > 0
                    ? "さらに追加"
                    : "クリックしてファイルを選択"}
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
                if (picked.length > 0) {
                  set("attachmentFiles", [...form.attachmentFiles, ...picked]);
                }
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
              {form.approverIds.map((id, i) => (
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
                    excludeIds={form.approverIds
                      .filter((_, idx) => idx !== i)
                      .filter(Boolean)}
                  />
                  <button
                    type="button"
                    className="w-6 h-6 grid place-items-center text-ink-4 rounded-sm hover:bg-bg-hover hover:text-ink border-none bg-transparent"
                    onClick={() => removeApprover(i)}
                    disabled={form.approverIds.length <= 1}
                    style={{ opacity: form.approverIds.length <= 1 ? 0.3 : 1 }}
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
              ※ 提出後、最初の承認者に通知が送信されます。
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
                {submitting ? "提出中..." : "申請を提出"}
              </button>
            </div>
          </div>
        </form>

        {/* AIセクション */}
        <div className="w-[45%] shrink-0 sticky top-[80px] bg-bg-elev border border-line rounded shadow-card overflow-hidden">
          <div className="ai-section px-[26px] py-5 pb-[22px] border-b border-line bg-[linear-gradient(180deg,oklch(0.97_0.018_285)_0%,oklch(0.985_0.008_285)_100%)]">
            <div className="flex items-start justify-between gap-3 mb-3.5">
              <div className="flex items-start gap-3">
                <span
                  className="w-7 h-7 rounded-[7px] grid place-items-center text-white shrink-0 shadow-[0_1px_2px_oklch(0.45_0.08_265/0.25),inset_0_1px_0_rgba(255,255,255,0.2)]"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--accent) 0%, oklch(0.55 0.12 320) 100%)",
                  }}
                >
                  <Icon name="sparkle" size={14} />
                </span>
                <div>
                  <h3 className="m-0 mb-0.5 text-sm font-semibold tracking-[-0.002em]">
                    AIによるチケット生成
                  </h3>
                  <p className="m-0 text-ink-3 text-xs leading-[1.55]">
                    申請内容を自然な言葉で入力すると、フォームを自動で埋めるドラフトを生成します。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <textarea
                className="w-full bg-bg-elev border border-line rounded py-[9px] px-3 text-ink outline-none resize-y text-[13.5px] leading-[1.65] transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_3px_oklch(0.45_0.08_265/0.12)]"
                style={{ minHeight: 64 }}
                placeholder="例：来週月曜から3日間、家族の予定で有給休暇を取得したい"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={aiLoading}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    runGenerate();
                  }
                }}
              />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="font-mono text-[10.5px] tracking-[0.06em] text-ink-4 uppercase">
                    例:
                  </span>
                  {AI_EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      className="bg-bg-elev border border-line rounded-full px-2.5 py-1 text-[11.5px] text-ink-2 whitespace-nowrap cursor-pointer transition-[background,border-color,color] hover:bg-accent-bg hover:border-accent-line hover:text-accent disabled:opacity-50 disabled:cursor-default"
                      onClick={() => setAiPrompt(ex)}
                      disabled={aiLoading}
                    >
                      {ex.length > 22 ? ex.slice(0, 22) + "…" : ex}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-[18px] py-[9px] rounded border border-ink bg-ink text-[#F4F2EC] font-medium text-[13px] whitespace-nowrap transition-[background,border-color] hover:enabled:bg-[linear-gradient(135deg,var(--accent)_0%,oklch(0.50_0.10_290)_100%)] hover:enabled:border-transparent disabled:opacity-55 disabled:cursor-default"
                  onClick={runGenerate}
                  disabled={!aiPrompt.trim() || aiLoading}
                >
                  {aiLoading ? (
                    <>
                      <span className="w-3 h-3 border-[1.5px] border-[rgba(244,242,236,0.3)] border-t-[#F4F2EC] rounded-full inline-block animate-ai-spin" />{" "}
                      生成中…
                    </>
                  ) : (
                    <>
                      <Icon name="sparkle" size={13} /> 生成
                    </>
                  )}
                </button>
              </div>
              {aiError && (
                <div className="flex items-center gap-1.5 text-xs text-status-rejected-fg bg-status-rejected-bg border border-[oklch(0.85_0.06_25)] rounded-sm px-2.5 py-[7px]">
                  <Icon name="x" size={12} /> {aiError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {aiPreview && (
        <AiPreviewModal
          preview={aiPreview}
          prompt={aiPrompt}
          onApply={applyPreview}
          onClose={() => setAiPreview(null)}
          onRegen={() => {
            setAiPreview(null);
            runGenerate();
          }}
        />
      )}
    </div>
  );
}
