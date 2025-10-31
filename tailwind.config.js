/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Scans all your component files for classes
  ],
  theme: {
    extend: {
      fontFamily: {
        // As per the JSON spec, 'Inter' is a good default
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
