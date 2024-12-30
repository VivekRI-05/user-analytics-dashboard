/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rinexis: {
          bg: '#C2C8CC',
          primary: '#1B365D',
          secondary: '#3B5998',
          tertiary: '#5B7BA5',
          quaternary: '#7B9CC2',
        }
      }
    },
  },
  plugins: [],
} 