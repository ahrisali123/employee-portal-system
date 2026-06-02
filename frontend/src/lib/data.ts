export const TICKET_CATEGORIES = [
  {
    key: 'leave',
    label: '休暇・休業',
    types: [
      { code: 'ANNUAL_LEAVE', label: '年次有給休暇' },
      { code: 'SICK_LEAVE', label: '病気休暇' },
      { code: 'COMP_LEAVE', label: '代休' },
      { code: 'SPECIAL_LEAVE', label: '特別休暇' },
      { code: 'ABSENCE', label: '欠勤' },
    ],
  },
  {
    key: 'family',
    label: '育児・介護・慶弔',
    types: [
      { code: 'MATERNITY', label: '産前産後休業' },
      { code: 'PATERNITY', label: '育児休業（父親）' },
      { code: 'CHILDCARE', label: '育児休業' },
      { code: 'NURSING', label: '介護休業' },
      { code: 'BEREAVEMENT', label: '忌引休暇' },
    ],
  },
  {
    key: 'attendance',
    label: '勤怠',
    types: [
      { code: 'OVERTIME', label: '残業' },
      { code: 'HOLIDAY_WORK', label: '休日出勤' },
      { code: 'EARLY_LEAVE', label: '早退' },
      { code: 'LATE_ARRIVAL', label: '遅刻' },
    ],
  },
  {
    key: 'travel',
    label: '出張・テレワーク',
    types: [
      { code: 'TELEWORK', label: 'テレワーク' },
      { code: 'BUSINESS_TRIP', label: '出張' },
    ],
  },
  {
    key: 'expense',
    label: '経費・購買',
    types: [
      { code: 'EXPENSE', label: '経費精算' },
      { code: 'PURCHASE', label: '備品購入' },
    ],
  },
  {
    key: 'other',
    label: 'その他',
    types: [
      { code: 'TRAINING', label: '研修' },
      { code: 'COMMUTE_CHANGE', label: '通勤経路変更' },
      { code: 'ADVANCE_SALARY', label: '給与前払い' },
      { code: 'OTHER', label: 'その他' },
    ],
  },
];

export const TYPE_INDEX: Record<string, { code: string; label: string; category: string; categoryKey: string }> = {};
TICKET_CATEGORIES.forEach((c) =>
  c.types.forEach((t) => {
    TYPE_INDEX[t.code] = { ...t, category: c.label, categoryKey: c.key };
  })
);

export const STATUS_FILTERS = [
  { code: null, label: 'すべて' },
  { code: 'PENDING', label: '承認待ち' },
  { code: 'APPROVED', label: '承認済み' },
  { code: 'REJECTED', label: '差し戻し' },
  { code: 'WITHDRAWN', label: '取り下げ' },
];

export const ANNOUNCEMENT_CATEGORIES = [
  { key: 'general', label: '総務' },
  { key: 'hr', label: '人事' },
  { key: 'system', label: 'システム' },
  { key: 'event', label: 'イベント' },
  { key: 'safety', label: '安全衛生' },
  { key: 'other', label: 'その他' },
];

export const ANN_CAT_INDEX: Record<string, { key: string; label: string }> = {};
ANNOUNCEMENT_CATEGORIES.forEach((c) => { ANN_CAT_INDEX[c.key] = c; });

export const SEVERITY: Record<string, { label: string; fg: string; bg: string; dot: string }> = {
  LOW:    { label: '低',   fg: 'oklch(0.45 0.06 240)', bg: 'oklch(0.96 0.02 240)', dot: 'oklch(0.60 0.10 240)' },
  NORMAL: { label: '通常', fg: '#3D3D3A',              bg: '#ECEAE3',              dot: '#9A9A93' },
  HIGH:   { label: '高',   fg: 'oklch(0.42 0.10 75)',  bg: 'oklch(0.95 0.04 85)',  dot: 'oklch(0.65 0.16 75)' },
  URGENT: { label: '緊急', fg: 'oklch(0.45 0.14 25)',  bg: 'oklch(0.95 0.03 25)',  dot: 'oklch(0.60 0.18 25)' },
};
export const SEVERITY_ORDER = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

export function fmtDate(iso: string | null | undefined, opts: { withTime?: boolean; slash?: boolean } = {}): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const sep = opts.slash ? '/' : '-';
  let s = `${Y}${sep}${M}${sep}${D}`;
  if (opts.withTime) {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    s += ` ${h}:${m}`;
  }
  return s;
}

export function fmtRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return '今';
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}日前`;
  return fmtDate(iso, { slash: true });
}

export function fmtYen(n: number | null | undefined): string {
  if (n == null) return '—';
  return `¥${n.toLocaleString('ja-JP')}`;
}
