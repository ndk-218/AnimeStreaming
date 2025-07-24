/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom colors cho video platform
      colors: {
        'video-dark': '#0f0f0f',
        'video-gray': '#1a1a1a',
        'video-light': '#2d2d2d',
      },
      // Custom spacing cho video components
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      // Aspect ratios cho video player
      aspectRatio: {
        '16/9': '16 / 9',
        '4/3': '4 / 3',
      },
    },
  },
  plugins: [],
}