/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cloudflare-inspired orange accent
        'cf-orange': '#F6821F',
        'cf-orange-dark': '#E6730A',
      },
    },
  },
  plugins: [],
}

