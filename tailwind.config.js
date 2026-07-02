/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── "Warm paper" design system ──────────────────────────────────
        // Surfaces
        paper:   '#FAF9F5',   // app background
        surface: '#FFFFFF',   // cards, sheets
        field:   '#F4F2EC',   // inputs, chips, elevated rows
        line:    '#E5E2D9',   // hairline borders

        // Text
        ink:  '#1F231F',
        sub:  '#67705F',
        mute: '#9AA292',

        // Single accent — forest green (you / route / primary action)
        brand:        '#1B6B4A',
        'brand-deep': '#14523A',
        'brand-soft': '#E7F1EA',

        // Support
        amber:        '#B0700F',
        'amber-soft': '#FBF3E2',
        success:      '#1B6B4A',
        warning:      '#B0700F',
        danger:       '#BE4B3B',
        'danger-soft':'#FAECE8',

        // ── Legacy aliases (existing class names, warm values) ──────────
        primary:     '#1B6B4A',
        accent:      '#1B6B4A',
        bgdeep:      '#FAF9F5',
        bgcard:      '#FFFFFF',
        bgelevated:  '#F4F2EC',
        border:      '#E5E2D9',
        textprimary: '#1F231F',
        textmuted:   '#67705F',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"Space Mono"', 'ui-monospace', 'monospace'],
        display: ['Fraunces', '"Iowan Old Style"', 'Georgia', 'serif'],
      },
      borderRadius: {
        card:  '20px',
        input: '13px',
        btn:   '13px',
        badge: '9999px',
      },
      boxShadow: {
        sm:    '0 1px 3px rgba(31,35,31,0.06)',
        card:  '0 8px 30px rgba(31,35,31,0.08)',
        lg:    '0 20px 40px rgba(31,35,31,0.12)',
        float: '0 8px 24px rgba(31,35,31,0.10)',
      },
    },
  },
  plugins: [],
}
