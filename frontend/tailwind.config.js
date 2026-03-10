/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chess-dark': '#1a202c',
        'chess-light': '#2d3748',
      },
    },
  },
  plugins: [],
}