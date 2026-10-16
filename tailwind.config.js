/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/*.{js,ts,jsx,tsx}', './src/{components,data,lib,types,utils}/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        xs: '0 1px 2px 0 rgb(28 25 23 / 0.05)',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      },
      // Editorial paper theme: the legacy dark "slate" scale is remapped to warm
      // ivory/stone tones so existing slate-* utilities render light.
      colors: {
        slate: {
          50: '#1c1917',
          100: '#1c1917',
          200: '#292524',
          300: '#44403c',
          400: '#57534e',
          500: '#78716c',
          600: '#78716c',
          700: '#d6d3d1',
          800: '#e7e5e4',
          900: '#ffffff',
          950: '#faf9f6',
        },
        // Light accent tints used as text on dark are deepened for contrast on paper.
        indigo: { 100: '#3730a3', 200: '#3730a3', 300: '#4338ca', 400: '#4f46e5' },
        blue: { 100: '#1e40af', 200: '#1e40af', 300: '#1d4ed8', 400: '#2563eb' },
        emerald: { 100: '#065f46', 200: '#065f46', 300: '#047857', 400: '#059669' },
        amber: { 100: '#92400e', 200: '#92400e', 300: '#b45309', 400: '#b45309' },
        rose: { 100: '#9f1239', 200: '#9f1239', 300: '#be123c', 400: '#e11d48' },
        sky: { 100: '#075985', 200: '#075985', 300: '#0369a1', 400: '#0284c7' },
        purple: { 100: '#6b21a8', 200: '#6b21a8', 300: '#7e22ce', 400: '#9333ea' },
        cyan: { 100: '#155e75', 200: '#155e75', 300: '#0e7490', 400: '#0891b2' },
      },
    },
  },
  plugins: [],
};
