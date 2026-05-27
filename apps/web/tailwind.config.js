/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#060d1f",
          900: "#0a1628",
          800: "#0f2040",
          700: "#162d5a",
        },
        cyan: {
          DEFAULT: "#00e5ff",
          dim: "#00b8d9",
        },
        amber: {
          warn: "#f59e0b",
        },
        purple: {
          ai: "#a855f7",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
