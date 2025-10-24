/** @type {import('tailwindcss').Config} */
import animate from 'tw-animate-css';
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {},
  },
  plugins: [animate],
};