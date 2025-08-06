/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          600: '#2563EB',
          700: '#1D4ED8'
        },
        secondary: '#10B981',
        accent: '#F59E0B',
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          400: '#94A3B8',
          600: '#475569',
          900: '#0F172A'
        },
        error: '#EF4444',
        success: '#22C55E'
      },
      borderRadius: {
        xl: '12px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.1)'
      }
    }
  },
  plugins: []
};