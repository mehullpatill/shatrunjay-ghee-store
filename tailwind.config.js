/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        maroon: "#8b0000", "maroon-dark": "#6d0000", leaf: "#006400",
        cream: "#fffaf0", ink: "#2a1a14", kadhai: "#24150f",
        "kadhai-2": "#3a241a", ghee: "#e0a526", "ghee-soft": "#fbf1d9",
        paper: "#f5f4f1", line: "#e6e1d9", muted: "#6f625a",
        label: "#1d4a2f", butter: "#fbf5e6"
      },
      fontFamily: {
        display: ["var(--font-mukta)", "var(--font-inter)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
