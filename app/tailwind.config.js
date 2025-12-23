/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#DB2827', dark: '#B91C1C', light: '#EF4444' },
        accent: { DEFAULT: '#3C3641', dark: '#2D2832' },
      },
    },
  },
  plugins: [],
}
