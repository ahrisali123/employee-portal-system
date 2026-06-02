'use client';

import { useState, useEffect, useRef } from 'react';
import { TICKET_CATEGORIES, TYPE_INDEX } from '@/lib/data';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function GroupedSelect({ value, onChange, placeholder = '選択してください' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cur = value ? TYPE_INDEX[value] : null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="select-field w-full bg-bg-elev border border-line rounded py-[9px] px-3 text-ink outline-none transition-[border-color,box-shadow] duration-[0.12s] flex items-center justify-between gap-2 text-left focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-bg)]"
        onClick={() => setOpen((o) => !o)}
      >
        {cur ? (
          <span className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-ink-4">{cur.category}</span>
            <span>{cur.label}</span>
          </span>
        ) : (
          <span className="text-ink-4">{placeholder}</span>
        )}
      </button>

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-bg-elev border border-line rounded shadow-pop max-h-[340px] overflow-y-auto z-30 p-1.5">
          {TICKET_CATEGORIES.map((cat) => (
            <div key={cat.key} className="px-1 pt-1.5 pb-0.5">
              <div className="text-[10px] tracking-[0.08em] uppercase text-ink-4 font-mono px-2 py-1">
                {cat.label}
              </div>
              {cat.types.map((t) => (
                <button
                  key={t.code}
                  type="button"
                  onClick={() => { onChange(t.code); setOpen(false); }}
                  className={`flex w-full px-2.5 py-[7px] rounded-sm text-[13px] text-ink text-left cursor-pointer border-none ${value === t.code ? 'bg-bg-subtle' : 'bg-transparent hover:bg-bg-subtle'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
