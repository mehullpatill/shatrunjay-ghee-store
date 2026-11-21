import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        espresso: {
          DEFAULT: "#24160E",
          light: "#3A2315",
          muted: "#5A3D2B",
        },
        cream: {
          DEFAULT: "#FFFBF2",
          soft: "#FAF5E8",
          warm: "#F3EAD6",
        },
        ghee: {
          DEFAULT: "#C6922C",
          light: "#E0B354",
          dark: "#9F711B",
        },
        leaf: {
          DEFAULT: "#5E8B3E",
          light: "#78A856",
        },
        taupe: "#7A6A58",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
