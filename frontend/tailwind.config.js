/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1C2B45',
          soft: '#4A5568',
          faint: '#7A8699',
        },
        paper: '#F7F1E4',
        card: '#FFFDF8',
        line: 'rgba(28, 43, 69, 0.14)',
        brass: {
          DEFAULT: '#B8842E',
          soft: '#F0E2C4',
          dark: '#8F6420',
        },
        stamp: {
          DEFAULT: '#A73B3B',
          soft: '#F3DCDC',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '3px 3px 0 0 rgba(28, 43, 69, 0.9)',
        'card-sm': '2px 2px 0 0 rgba(28, 43, 69, 0.9)',
        'card-hover': '5px 5px 0 0 rgba(28, 43, 69, 0.9)',
      },
      backgroundImage: {
        dotgrid: 'radial-gradient(rgba(28,43,69,0.16) 1px, transparent 1px)',
      },
      backgroundSize: {
        dotgrid: '22px 22px',
      },
    },
  },
  plugins: [],
};