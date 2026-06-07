/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:     '#00FF88',
        accent:      '#00D4FF',
        warning:     '#FFB800',
        danger:      '#FF4D6D',
        bgdeep:      '#080C14',
        bgcard:      '#0D1A2A',
        bgelevated:  '#112236',
        border:      '#1A3A5C',
        textprimary: '#E0F0FF',
        textmuted:   '#4A7A9B',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        mono:    ['"Space Mono"', 'monospace'],
        body:    ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

