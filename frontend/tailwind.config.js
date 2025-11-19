/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Capital Factory Yellow/Gold palette
        primary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#E5A000',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        // Capital Factory neutrals
        cf: {
          dark: '#112337',
          gray: '#585e6a',
          border: '#686e77',
          light: '#F5C544',
          lighter: '#FFF3D6',
          cream: '#F5F0E6',
        },
      },
      boxShadow: {
        'cf': '6px 6px 9px rgba(0, 0, 0, 0.1)',
        'cf-deep': '12px 12px 50px rgba(0, 0, 0, 0.15)',
        'cf-hover': '8px 8px 12px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'cf': '3px',
        'pill': '9999px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
}





