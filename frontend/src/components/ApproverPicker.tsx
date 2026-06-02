"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar } from "./Avatar";
import type { Approver } from "@/types";

interface Props {
  approvers: Approver[];
  value: string;
  onChange: (id: string) => void;
  excludeIds?: string[];
}

export function ApproverPicker({
  approvers,
  value,
  onChange,
  excludeIds = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = value ? approvers.find((a) => a.id === value) : null;
  const filtered = approvers.filter(
    (a) =>
      (!excludeIds.includes(a.id) || a.id === value) &&
      (!q || a.name.includes(q) || a.departmentName.includes(q)),
  );

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        className="flex items-center gap-2 w-full bg-bg-elev border border-line rounded-sm px-2.5 py-1.5 text-[13px] cursor-pointer text-left"
        onClick={() => setOpen((o) => !o)}
      >
        {selected ? (
          <>
            <Avatar name={selected.name} size={22} />
            <span className="font-medium">{selected.name}</span>
            <span className="text-ink-3 text-xs ml-auto">
              {selected.departmentName}
            </span>
          </>
        ) : (
          <span className="text-ink-4">承認者を選択</span>
        )}
      </button>

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-bg-elev border border-line rounded shadow-pop max-h-[320px] overflow-y-auto z-30">
          <div className="p-2 border-b border-line">
            <input
              autoFocus
              className="w-full bg-bg-elev border border-line rounded py-1.5 px-2.5 text-[12.5px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-bg)]"
              placeholder="名前または部署で検索"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {filtered.length === 0 && (
            <div className="p-4 text-xs text-ink-4 text-center">該当者なし</div>
          )}

          {filtered.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                onChange(a.id);
                setOpen(false);
                setQ("");
              }}
              className={`flex items-center gap-2.5 w-full px-3 py-2 border-b border-line cursor-pointer text-left border-none ${a.id === value ? "bg-bg-subtle" : "bg-transparent hover:bg-bg-subtle"}`}
            >
              <Avatar name={a.name} size={26} />
              <div className="flex-1 leading-[1.3]">
                <div className="text-[13px] font-medium">{a.name}</div>
                <div className="text-[11.5px] text-ink-3">
                  {a.departmentName}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
