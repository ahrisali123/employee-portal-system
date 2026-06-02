'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ANN_CAT_INDEX, fmtDate } from '@/lib/data';
import { getAnnouncement, acknowledgeAnnouncement, deleteAnnouncement, getAnnouncementAttachmentDownloadUrl, getAnnouncementConfirmationStatus } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { SeverityBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import type { Announcement, AnnouncementAttachment, AnnouncementConfirmationStatus } from '@/types';

function AttachmentRow({
  attachment,
  token,
  announcementId,
}: {
  attachment: AnnouncementAttachment;
  token: string;
  announcementId: string;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url = await getAnnouncementAttachmentDownloadUrl(token, announcementId, attachment.id);
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = attachment.fileName;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-bg-subtle border border-line rounded-sm text-[13px]">
      <Icon name="file" size={14} />
      <span className="font-medium">{attachment.fileName}</span>
      {attachment.fileSize != null && (
        <span className="font-mono text-[11px] text-ink-4">
          {attachment.fileSize < 1024 * 1024
            ? `${Math.round(attachment.fileSize / 1024)} KB`
            : `${(attachment.fileSize / 1024 / 1024).toFixed(1)} MB`}
        </span>
      )}
      <button
        className="inline-flex items-center gap-1.5 px-2.5 py-[5px] text-xs rounded border border-line bg-bg-elev hover:bg-bg-hover transition-colors ml-auto disabled:opacity-50"
        onClick={handleDownload}
        disabled={downloading}
      >
        <Icon name="download" size={12} /> {downloading ? '...' : '開く'}
      </button>
    </div>
  );
}

export default function AnnouncementDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [ann, setAnn] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<AnnouncementConfirmationStatus | null>(null);

  useEffect(() => {
    if (!user) return;
    getAnnouncement(user.accessToken, params.id)
      .then((data) => {
        setAnn(data);
        if (user.activeRole === 'ADMIN' && data.requiresAcknowledge) {
          getAnnouncementConfirmationStatus(user.accessToken, params.id)
            .then(setConfirmStatus)
            .catch(() => {});
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [user, params.id]);

  if (loading) {
    return <div className="px-8 py-7 text-ink-3 text-[13px]">読み込み中...</div>;
  }

  if (notFound || !ann) {
    return (
      <div className="px-8 py-7">
        <div className="py-16 text-center text-ink-3">
          <Icon name="megaphone" size={20} />
          <h3 className="text-ink mt-2 mb-0 text-base font-semibold">お知らせが見つかりません</h3>
          <p className="m-0 text-[13px]">削除されたか、URLが間違っている可能性があります。</p>
        </div>
      </div>
    );
  }

  const cat = ANN_CAT_INDEX[ann.category];
  const acknowledged = ann.acknowledged;
  const needsAcknowledge = ann.requiresAcknowledge && !acknowledged && user?.activeRole !== 'ADMIN';
  const deptLabel = ann.targetDepartments.length === 0 ? '全社' : ann.targetDepartments.map((d) => d.name).join(', ');
  const isDraft = ann.status === 'DRAFT';

  const handleAcknowledge = async () => {
    if (!user) return;
    setAcknowledging(true);
    try {
      await acknowledgeAnnouncement(user.accessToken, ann.id);
      setAnn((prev) => prev ? { ...prev, acknowledged: true } : prev);
    } finally {
      setAcknowledging(false);
    }
  };

  const dtLabel = 'text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3 mb-1';
  const dtVal   = 'text-sm';

  return (
    <div className="px-8 py-7 pb-16 max-w-[1240px]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <button
          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded border-none bg-transparent text-ink-2 hover:bg-bg-hover transition-colors"
          onClick={() => router.back()}
        >
          ← 一覧へ戻る
        </button>
        {ann.ownAnnouncement && ann.status === 'DRAFT' && (
          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-[13px] text-ink-2">本当に削除しますか？</span>
                <button
                  className="inline-flex items-center px-3 py-1.5 rounded border border-status-rejected-dot bg-status-rejected-bg text-status-rejected-fg font-medium text-[13px] hover:opacity-80 transition-opacity disabled:opacity-50"
                  disabled={deleting}
                  onClick={async () => {
                    if (!user) return;
                    setDeleting(true);
                    try {
                      await deleteAnnouncement(user.accessToken, ann.id);
                      router.push('/announcements');
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  {deleting ? '削除中...' : '削除する'}
                </button>
                <button
                  className="inline-flex items-center px-3 py-1.5 rounded border border-line bg-bg-elev text-ink font-medium text-[13px] hover:bg-bg-hover transition-colors"
                  onClick={() => setConfirmDelete(false)}
                >
                  キャンセル
                </button>
              </>
            ) : (
              <>
                <button
                  className="inline-flex items-center px-3.5 py-2 rounded border border-status-rejected-dot bg-status-rejected-bg text-status-rejected-fg font-medium text-[13px] hover:brightness-95 transition-[filter]"
                  onClick={() => setConfirmDelete(true)}
                >
                  削除
                </button>
                <button
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-ink bg-ink text-[#F4F2EC] font-medium text-[13px] hover:bg-[#2A2A28] transition-colors"
                  onClick={() => router.push(`/announcements/${ann.id}/edit`)}
                >
                  編集する
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-[22px] items-start" style={{ gridTemplateColumns: '1fr 360px' }}>
        <div className="flex flex-col gap-4">
          {needsAcknowledge && (
            <div className="grid overflow-hidden rounded border border-[oklch(0.85_0.08_75)] bg-status-pending-bg" style={{ gridTemplateColumns: '4px 1fr' }}>
              <div className="bg-status-pending-dot" />
              <div className="px-[18px] py-3.5 flex flex-col gap-0.5">
                <div className="flex items-center gap-2 font-semibold text-status-pending-fg text-[13.5px]">
                  <Icon name="bell" size={14} /> このお知らせは確認が必要です
                </div>
                <div className="text-[12.5px] text-ink-2 leading-[1.6]">内容を確認の上、ページ下部の「確認しました」ボタンを押してください。</div>
              </div>
            </div>
          )}

          <div className="bg-bg-elev border border-line rounded overflow-hidden shadow-card">
            <div className="px-[26px] py-6 pb-[18px] border-b border-line flex flex-col gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <SeverityBadge severity={ann.priority} />
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-medium bg-bg-subtle text-ink-2 border border-line">{cat?.label}</span>
                {ann.requiresAcknowledge && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-status-rejected-fg bg-status-rejected-bg px-2 py-0.5 rounded-full">
                    <Icon name="check" size={11} /> 確認必須
                  </span>
                )}
                {isDraft && (
                  <span className="text-[10.5px] font-mono uppercase tracking-[0.06em] text-ink-3 bg-bg-subtle px-2 py-0.5 rounded-full border border-dashed border-line-strong">下書き</span>
                )}
              </div>
              <h1 className="text-2xl font-semibold tracking-[-0.005em] m-0 leading-[1.35]">{ann.title}</h1>
              <div className="flex items-center flex-wrap">
                <div className="flex items-center gap-2">
                  <Avatar name={ann.authorName} size={24} />
                  <div className="leading-[1.25]">
                    <div className="text-[13px] font-medium">{ann.authorName}</div>
                    <div className="text-[11.5px] text-ink-4">{ann.authorDepartmentName}</div>
                  </div>
                </div>
                <span className="ml-auto text-ink-3 text-xs font-mono">
                  公開 {fmtDate(ann.publishedAt ?? ann.createdAt, { withTime: true, slash: true })}
                </span>
              </div>
            </div>

            <div className="px-[22px] py-[18px]">
              <div className="text-sm leading-[1.85] text-ink-2 whitespace-pre-wrap tracking-[0.005em]">{ann.content}</div>

              {ann.attachments.length > 0 && (
                <div className="mt-[22px] pt-[18px] border-t border-line">
                  <div className={`${dtLabel} mb-2.5`}>添付ファイル</div>
                  <div className="flex flex-col gap-1.5">
                    {ann.attachments.map((att) => (
                      <AttachmentRow
                        key={att.id}
                        attachment={att}
                        token={user!.accessToken}
                        announcementId={ann.id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {needsAcknowledge && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-line bg-status-pending-bg">
                <div className="text-xs text-status-pending-fg">本お知らせの内容を確認しましたか？</div>
                <button
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-ink bg-ink text-[#F4F2EC] font-medium text-[13px] hover:bg-[#2A2A28] transition-colors disabled:opacity-50"
                  onClick={handleAcknowledge}
                  disabled={acknowledging}
                >
                  <Icon name="check" size={14} /> {acknowledging ? '処理中...' : '確認しました'}
                </button>
              </div>
            )}
            {acknowledged && ann.requiresAcknowledge && user?.activeRole !== 'ADMIN' && (
              <div className="flex items-center px-5 py-3.5 border-t border-line bg-status-approved-bg">
                <div className="flex items-center gap-1.5 text-xs text-status-approved-fg">
                  <Icon name="check" size={14} /> 確認済み
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 sticky top-[72px]">
          <div className="bg-bg-elev border border-line rounded overflow-hidden shadow-card">
            <div className="px-[22px] py-[18px] border-b border-line flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold m-0">お知らせ情報</h3>
            </div>
            <div className="px-[22px] py-[18px]">
              <div className="flex flex-col gap-3.5">
                <div><div className={dtLabel}>重要度</div><div className={dtVal}><SeverityBadge severity={ann.priority} /></div></div>
                <div><div className={dtLabel}>カテゴリ</div><div className={dtVal}>{cat?.label}</div></div>
                <div>
                  <div className={dtLabel}>対象部署</div>
                  <div className="flex flex-wrap gap-1 text-sm">
                    {ann.targetDepartments.length === 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-medium bg-bg-subtle text-ink-2 border border-line">全社</span>
                    ) : (
                      ann.targetDepartments.map((d) => (
                        <span key={d.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-medium bg-bg-subtle text-ink-2 border border-line">{d.name}</span>
                      ))
                    )}
                  </div>
                </div>
                <div><div className={dtLabel}>確認</div><div className="text-[13px]">{ann.requiresAcknowledge ? '必須' : '任意'}</div></div>
                <div>
                  <div className={dtLabel}>公開状態</div>
                  <div className={dtVal}>
                    {ann.status === 'PUBLISHED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11.5px] font-medium bg-status-approved-bg text-status-approved-fg">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-approved-dot" />公開中
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-mono uppercase tracking-[0.06em] text-ink-3 bg-bg-subtle px-2 py-0.5 rounded-full border border-dashed border-line-strong">下書き</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {user?.activeRole === 'ADMIN' && ann.requiresAcknowledge && confirmStatus && (
            <div className="bg-bg-elev border border-line rounded overflow-hidden shadow-card">
              <div className="px-[22px] py-[18px] border-b border-line flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold m-0">確認状況</h3>
                <span className="text-[11px] font-mono text-ink-4">
                  {confirmStatus.confirmedCount} / {confirmStatus.total} 名
                </span>
              </div>
              <div className="px-[22px] py-[18px]">
                <div className="mb-[18px]">
                  <div className="h-1.5 rounded-full bg-bg-subtle border border-line overflow-hidden">
                    <div
                      className="h-full rounded-full bg-status-approved-dot transition-[width] duration-400"
                      style={{ width: `${confirmStatus.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-[7px] text-[11.5px] text-ink-3">
                    <span><strong className="text-ink font-semibold">{confirmStatus.percentage}%</strong> が確認済み</span>
                    <span style={{ color: confirmStatus.pending.length > 0 ? 'var(--status-rejected-fg)' : 'var(--ink-4)' }}>
                      未確認 {confirmStatus.pending.length} 名
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-[7px] text-[11.5px] font-semibold text-ink-2 mb-2.5">
                    <span className="w-[7px] h-[7px] rounded-full bg-status-approved-dot flex-shrink-0" />
                    確認済み
                    <span className="ml-auto font-mono text-[11px] text-ink-4 bg-bg-subtle border border-line rounded-full px-2 py-px">
                      {confirmStatus.confirmedCount}
                    </span>
                  </div>
                  {confirmStatus.confirmed.length === 0 ? (
                    <p className="text-[12px] text-ink-4 px-2">まだ誰も確認していません。</p>
                  ) : (
                    <ul className="list-none p-0 m-0 flex flex-col gap-1">
                      {confirmStatus.confirmed.map((u) => (
                        <li key={u.userId} className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-bg-hover transition-colors">
                          <Avatar name={u.name} size={28} />
                          <div className="flex flex-col leading-[1.3] flex-1 min-w-0">
                            <span className="text-[13px] font-medium text-ink truncate">{u.name}</span>
                            <span className="text-[11px] text-ink-4">{u.departmentName}</span>
                          </div>
                          <Icon name="check" size={13} className="text-status-approved-fg flex-shrink-0" />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-line">
                  <div className="flex items-center gap-[7px] text-[11.5px] font-semibold text-ink-2 mb-2.5">
                    <span className="w-[7px] h-[7px] rounded-full border-[1.5px] border-status-rejected-fg flex-shrink-0" />
                    未確認
                    <span className="ml-auto font-mono text-[11px] text-ink-4 bg-bg-subtle border border-line rounded-full px-2 py-px">
                      {confirmStatus.pending.length}
                    </span>
                  </div>
                  {confirmStatus.pending.length === 0 ? (
                    <p className="text-[12px] text-ink-4 px-2">対象者全員が確認済みです。</p>
                  ) : (
                    <ul className="list-none p-0 m-0 flex flex-col gap-1">
                      {confirmStatus.pending.map((u) => (
                        <li key={u.userId} className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-bg-hover transition-colors opacity-85">
                          <Avatar name={u.name} size={28} />
                          <div className="flex flex-col leading-[1.3] flex-1 min-w-0">
                            <span className="text-[13px] font-medium text-ink-2 truncate">{u.name}</span>
                            <span className="text-[11px] text-ink-4">{u.departmentName}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
