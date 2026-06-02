'use client';

const paths: Record<string, React.ReactNode> = {
  home: <><path d="M2.5 7.5L8 3l5.5 4.5" /><path d="M4 7v6h8V7" /></>,
  plus: <><path d="M8 3v10M3 8h10" /></>,
  inbox: <><path d="M2.5 9.5V12.5H13.5V9.5" /><path d="M2.5 9.5L4 3.5h8l1.5 6" /><path d="M5.5 9.5C5.5 10.6 6.4 11.5 7.5 11.5h1c1.1 0 2-.9 2-2" /></>,
  list: <><path d="M5 4h9M5 8h9M5 12h9" /><circle cx="2.5" cy="4" r="0.7" /><circle cx="2.5" cy="8" r="0.7" /><circle cx="2.5" cy="12" r="0.7" /></>,
  user: <><circle cx="8" cy="5.5" r="2.5" /><path d="M3 13.5c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" /></>,
  search: <><circle cx="7" cy="7" r="4" /><path d="M10 10l3 3" /></>,
  x: <><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></>,
  check: <><path d="M3 8.5l3.5 3.5L13 4.5" /></>,
  chevron: <><path d="M6 3l4 5-4 5" /></>,
  logout: <><path d="M9.5 4.5V3.5H3.5V12.5H9.5V11.5" /><path d="M6.5 8h7M11 5.5L13.5 8 11 10.5" /></>,
  download: <><path d="M8 2.5v8M4.5 7L8 10.5 11.5 7M3 13.5h10" /></>,
  bell: <><path d="M4 11V7.5a4 4 0 1 1 8 0V11l1 1.5H3L4 11z" /><path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" /></>,
  megaphone: <><path d="M2.5 6v4l7.5 2.5V3.5L2.5 6z" /><path d="M10 4.5l2.5-1v9l-2.5-1" /><path d="M5 10.5L6 13.5h1.5l-1-3" /></>,
  clip: <><path d="M11 5L6.5 9.5a2 2 0 0 0 2.8 2.8L13.5 8a3.5 3.5 0 0 0-5-5L4 7.5a5 5 0 0 0 7 7l3.5-3.5" /></>,
  edit: <><path d="M3 13h3L13 6l-3-3-7 7v3z" /><path d="M9.5 3.5l3 3" /></>,
  refresh: <><path d="M3 8a5 5 0 0 1 8.5-3.5L13 6" /><path d="M13 3v3h-3" /><path d="M13 8a5 5 0 0 1-8.5 3.5L3 10" /><path d="M3 13v-3h3" /></>,
  file: <><path d="M4 2h5l3 3v9H4V2z" /><path d="M9 2v3h3" /></>,
  sparkle: <><path d="M8 2l1.5 4.5L14 8l-4.5 1.5L8 14l-1.5-4.5L2 8l4.5-1.5z" /></>,
};

export function Icon({ name, size = 16, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
