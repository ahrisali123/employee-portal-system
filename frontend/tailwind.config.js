/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--bg)',
          elev: 'var(--bg-elev)',
          sidebar: 'var(--bg-sidebar)',
          hover: 'var(--bg-hover)',
          subtle: 'var(--bg-subtle)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
          4: 'var(--ink-4)',
          5: 'var(--ink-5)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          2: 'var(--accent-2)',
          bg: 'var(--accent-bg)',
          line: 'var(--accent-line)',
        },
        status: {
          'pending-bg':  'var(--status-pending-bg)',
          'pending-fg':  'var(--status-pending-fg)',
          'pending-dot': 'var(--status-pending-dot)',
          'approved-bg':  'var(--status-approved-bg)',
          'approved-fg':  'var(--status-approved-fg)',
          'approved-dot': 'var(--status-approved-dot)',
          'rejected-bg':  'var(--status-rejected-bg)',
          'rejected-fg':  'var(--status-rejected-fg)',
          'rejected-dot': 'var(--status-rejected-dot)',
          'withdrawn-bg':  'var(--status-withdrawn-bg)',
          'withdrawn-fg':  'var(--status-withdrawn-fg)',
          'withdrawn-dot': 'var(--status-withdrawn-dot)',
        },
      },
      borderRadius: {
        sm:  'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg:  'var(--radius-lg)',
        full: '9999px',
      },
      boxShadow: {
        pop:  'var(--shadow-pop)',
        card: 'var(--shadow-card)',
      },
      fontFamily: {
        jp:   ['var(--font-jp)'],
        en:   ['var(--font-en)'],
        mono: ['var(--font-mono)'],
      },
      keyframes: {
        'modal-fade': { from: { opacity: 0 }, to: { opacity: 1 } },
        'modal-pop':  {
          from: { opacity: 0, transform: 'translateY(4px) scale(0.98)' },
          to:   { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        'ai-spin': { to: { transform: 'rotate(360deg)' } },
        pulse: {
          '0%':   { boxShadow: '0 0 0 0 oklch(0.60 0.18 25 / 0.5)' },
          '70%':  { boxShadow: '0 0 0 8px oklch(0.60 0.18 25 / 0)' },
          '100%': { boxShadow: '0 0 0 0 oklch(0.60 0.18 25 / 0)' },
        },
      },
      animation: {
        'modal-fade': 'modal-fade 0.16s ease-out',
        'modal-pop':  'modal-pop 0.18s ease-out',
        'ai-spin':    'ai-spin 0.7s linear infinite',
        pulse:        'pulse 2s infinite',
      },
    },
  },
  plugins: [],
};
