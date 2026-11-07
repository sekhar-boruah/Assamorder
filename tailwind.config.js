/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '"Noto Sans Bengali"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
