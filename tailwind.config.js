/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          greenDark: '#0e4122',   // Deeper green
          greenMid: '#166236',
          greenPale: '#e3f0e8',
          amber: '#d97706',
          amberBg: '#fef3c7',
          red: '#dc2626',
          redBg: '#fee2e2',
          textPrimary: '#1a1c1a', // Softer black/green tint
          textSecondary: '#6b7264', // Muted olive/gray
          surface: '#ffffff',
          surfaceAlt: '#f8f7f2',  // Warm off-white / cream
          border: 'rgba(20, 40, 20, 0.08)', // Warmer, slightly green border
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
