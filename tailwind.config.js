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
      fontSize: {
        'xs': ['0.875rem', { lineHeight: '1.75rem' }],   // originally sm (14px)
        'sm': ['1rem', { lineHeight: '2rem' }],        // originally base (16px)
        'base': ['1.125rem', { lineHeight: '2.25rem' }], // originally lg (18px)
        'lg': ['1.25rem', { lineHeight: '2.5rem' }],    // originally xl (20px)
        'xl': ['1.5rem', { lineHeight: '2.75rem' }],        // originally 2xl (24px)
        '2xl': ['1.875rem', { lineHeight: '3rem' }],  // originally 3xl (30px)
        '3xl': ['2.25rem', { lineHeight: '3.25rem' }],    // originally 4xl (36px)
        '4xl': ['3rem', { lineHeight: '3.5rem' }],            // originally 5xl (48px)
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
}
