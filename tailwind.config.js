/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",         // if you use /app
    "./pages/**/*.{ts,tsx}",       // if you use /pages
    "./components/**/*.{ts,tsx}",  // components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
