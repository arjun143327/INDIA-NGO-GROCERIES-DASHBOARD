/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          greenDark: '#145c32',
          greenMid: '#1a6b3c',
          greenPale: '#e8f4ee',
          amber: '#d97706',
          amberBg: '#fef3c7',
          red: '#dc2626',
          redBg: '#fee2e2',
          textPrimary: '#111111',
          textSecondary: '#555555',
          surface: '#ffffff',
          surfaceAlt: '#f7f7f6',
          border: 'rgba(0,0,0,0.09)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
}
