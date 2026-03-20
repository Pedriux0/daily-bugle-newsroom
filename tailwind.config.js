/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'bangers': ['Bangers', 'cursive'],
        'courier': ['Courier Prime', 'monospace'],
        'space': ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
