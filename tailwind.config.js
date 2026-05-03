/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6ffe6',
          100: '#ccffcc',
          200: '#99ff99',
          300: '#66ff66',
          400: '#33cc33',
          500: '#009900',
          600: '#008800',
          700: '#007700',
          800: '#005500',
          900: '#003300',
        },
        emerald: {
          DEFAULT: '#003300',
        },
        gold: {
          DEFAULT: '#f9dc07',
        },
        accent: {
          DEFAULT: '#ff9900',
        },
        body: {
          DEFAULT: '#4d4d4d',
        },
      },
    },
  },
  plugins: [],
}
