module.exports = {
  content: [
    "./src/**/*.{html,js,jsx}",
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ff6347",
        secondary: "#4b5563",
        accent: "#f59e0b",
        muted: "#6b7280",
        brysk: "#fcd34d",
        hover: "#fef3c7",
      },
    },
  },
  plugins: [],
};
