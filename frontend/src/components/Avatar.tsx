'use client';

import { useMemo } from 'react';

export function Avatar({ name, size = 26 }: { name: string; size?: number }) {
  const initials = useMemo(() => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  }, [name]);

  return (
    <span
      className="rounded-full bg-ink text-[#F4F2EC] grid place-items-center font-semibold font-en shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initials}
    </span>
  );
}
