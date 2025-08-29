/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Adjusted cyan colors - reduced brightness
        primary: {
          50: '#f0fdff',
          100: '#ccf7fe',
          200: '#99effd',
          300: '#60e2fa',
          400: '#2bc4e8', // Darker cyan - reduced from #34d0f4
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          50: '#fef7f7',
          100: '#feecec',
          200: '#fdd6d6',
          300: '#fbb5b5',
          400: '#fa7299', // Main pink unchanged
          500: '#f472b6',
          600: '#ec4899',
          700: '#db2777',
          800: '#be185d',
          900: '#9d174d',
        },
        // Light theme colors
        light: {
          50: '#ffffff',
          100: '#f8fafc',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
