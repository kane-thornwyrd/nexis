/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      animation: {
        pulsate: "pulsate 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
