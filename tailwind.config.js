/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Design System (light surfaces) ─────────────────────────────
        brand:          '#2563EB',
        'brand-hover':  '#1D4ED8',
        'brand-subtle': '#EFF6FF',
        surface:        '#FFFFFF',
        bg:             '#F8FAFC',
        'bg-subtle':    '#F1F5F9',
        line:           '#E2E8F0',
        ink:            '#0F172A',
        sub:            '#64748B',
        mute:           '#94A3B8',
        success:        '#10B981',
        warning:        '#F59E0B',
        danger:         '#EF4444',

        // ── Legacy dark theme (TripPage) ────────────────────────────────
        primary:     '#00FF88',
        accent:      '#00D4FF',
        bgdeep:      '#080C14',
        bgcard:      '#0D1A2A',
        bgelevated:  '#112236',
        border:      '#1A3A5C',
        textprimary: '#E0F0FF',
        textmuted:   '#4A7A9B',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"Space Mono"', 'ui-monospace', 'monospace'],
        display: ['"Bebas Neue"', 'cursive'],
      },
      borderRadius: {
        card:  '24px',
        input: '14px',
        btn:   '12px',
        badge: '9999px',
      },
      boxShadow: {
        sm:   '0 1px 3px rgba(0,0,0,0.05)',
        card: '0 8px 30px rgba(0,0,0,0.08)',
        lg:   '0 20px 40px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
