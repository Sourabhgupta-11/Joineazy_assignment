/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6fe',
          200: '#bfd2fe',
          300: '#93b4fd',
          400: '#608bfa',
          500: '#3d63f5',
          600: '#2a42ea',
          700: '#2333d6',
          800: '#232cad',
          900: '#212a88',
        },
      },
    },
  },
  plugins: [],
};
