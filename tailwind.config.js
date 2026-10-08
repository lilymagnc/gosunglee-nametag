/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jongchin: {
          blue: '#7fb5e6',
          darkBlue: '#4a8ec9',
          lightBlue: '#c5def5',
          gold: '#d99b26'
        }
      },
      fontFamily: {
        myeongjo: ['"Batang"', '"Gowun Batang"', '"Nanum Myeongjo"', 'serif'],
        gungsuh: ['"Gungsuh"', '"Batang"', 'serif']
      }
    },
  },
  plugins: [],
}
