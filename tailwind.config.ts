import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Editorial healthcare palette
        cream: {
          50: "#FBF9F4",
          100: "#F8F5EF",
          200: "#F2EDE4",
          300: "#E8E1D3",
          400: "#D9CFBC",
        },
        ink: {
          50: "#5C5853",
          100: "#3D3A36",
          200: "#2A2724",
          300: "#1A1816",
        },
        forest: {
          50: "#E8EDEB",
          100: "#C7D3CF",
          200: "#7E948D",
          300: "#4A6660",
          400: "#2C4A47",
          500: "#1F3633",
        },
        stone: {
          border: "#E5DFD3",
          muted: "#A39B8A",
        },
        signal: {
          pending: "#B7894C",
          confirmed: "#2C4A47",
          cancelled: "#9B5A4E",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-geist)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
