/** @type {import('tailwindcss').Config} */
import animate from 'tw-animate-css';
export default {
  // Include index.html and all JS/JSX in src
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {},
  },
  // Import and enable the animate plugin
  plugins: [animate],
};