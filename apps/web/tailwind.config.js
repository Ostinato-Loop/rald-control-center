/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* ── Base: Control Center (cyber slate / tactical graphite) ── */
        cc: {
          bg:      "#060C14",
          surface: "#080F1A",
          elev1:   "#0C1624",
          elev2:   "#101D2E",
          border:  "rgba(255,255,255,0.07)",
          text:    "#C8D8E8",
          muted:   "#5A7080",
        },
        navy: {
          950: "#060d1f",
          900: "#0a1628",
          800: "#0f2040",
          700: "#162d5a",
        },

        /* ── LOOP — Neon Green (social commerce) ────────────── */
        loop: {
          DEFAULT:  "#00FF88",
          dim:      "#00D96F",
          glow:     "rgba(0,255,136,0.22)",
          bg:       "#0A1F16",
        },
        /* ── LOOP MESSENGER — Neon Orange (realtime comms) ──── */
        messenger: {
          DEFAULT:  "#FF7A00",
          dim:      "#E66D00",
          glow:     "rgba(255,122,0,0.22)",
          bg:       "#241100",
        },
        /* ── LOOP BUSINESS — Neon Orange (enterprise) ────────── */
        "loop-biz": {
          DEFAULT:  "#FF6A00",
          glow:     "rgba(255,106,0,0.22)",
          bg:       "#2A1200",
        },
        /* ── PAYRALD — Neon Navy Blue (elite fintech) ─────────── */
        payrald: {
          DEFAULT:  "#0066FF",
          accent:   "#3385FF",
          glow:     "rgba(0,102,255,0.22)",
          bg:       "#07111F",
        },
        /* ── RALDTICS — Neon Yellow (AI intelligence) ─────────── */
        raldtics: {
          DEFAULT:  "#FFD400",
          accent:   "#FFE14A",
          glow:     "rgba(255,212,0,0.22)",
          bg:       "#2B2400",
        },
        /* ── LOOP DISPATCH — Neon Blue (logistics) ────────────── */
        dispatch: {
          DEFAULT:  "#00BFFF",
          accent:   "#4DD8FF",
          glow:     "rgba(0,191,255,0.22)",
          bg:       "#041923",
        },
        /* ── DUNARALD — Neon Purple (entertainment) ───────────── */
        dunarald: {
          DEFAULT:  "#A855F7",
          accent:   "#C084FC",
          glow:     "rgba(168,85,247,0.22)",
          bg:       "#190726",
        },
        /* ── GITRALD — Neon Red (engineering infra) ───────────── */
        gitrald: {
          DEFAULT:  "#FF2E2E",
          accent:   "#FF6666",
          glow:     "rgba(255,46,46,0.22)",
          bg:       "#240505",
        },
        /* ── LOOP VOICE — Neon Pink ──────────────────────────── */
        "loop-voice": {
          DEFAULT:  "#FF4FAD",
          glow:     "rgba(255,79,173,0.22)",
          bg:       "#200B16",
        },
        /* ── RALD IDENTITY — Cyan ────────────────────────────── */
        "rald-identity": {
          DEFAULT:  "#00E5FF",
          glow:     "rgba(0,229,255,0.22)",
        },

        /* ── AI AGENT IDENTITIES ─────────────────────────────── */
        agent: {
          atlas:    "#00E5FF",
          sentinel: "#FF5722",
          nova:     "#A855F7",
          forge:    "#FF2E2E",
          echo:     "#00BFA5",
          pulse:    "#FFD400",
          lee:      "#0066FF",
        },

        /* ── Backward-compat / keep existing navy+cyan ── */
        cyan: {
          DEFAULT: "#00E5FF",
          dim:     "#00B8D9",
        },
        amber: {
          warn: "#f59e0b",
        },
        purple: {
          ai: "#A855F7",
        },
      },

      /* ── Control center typography ─────────────────────── */
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["Inter", "sans-serif"],
      },

      /* ── Glow shadows per product ──────────────────────── */
      boxShadow: {
        "glow-loop":      "0 0 18px rgba(0,255,136,0.3),  0 0 1px #00FF88",
        "glow-payrald":   "0 0 18px rgba(0,102,255,0.3),  0 0 1px #0066FF",
        "glow-raldtics":  "0 0 18px rgba(255,212,0,0.3),  0 0 1px #FFD400",
        "glow-dispatch":  "0 0 18px rgba(0,191,255,0.3),  0 0 1px #00BFFF",
        "glow-dunarald":  "0 0 18px rgba(168,85,247,0.3), 0 0 1px #A855F7",
        "glow-gitrald":   "0 0 18px rgba(255,46,46,0.3),  0 0 1px #FF2E2E",
        "glow-messenger": "0 0 18px rgba(255,122,0,0.3),  0 0 1px #FF7A00",
      },

      /* ── Animations ────────────────────────────────────── */
      animation: {
        "pulse-slow":  "pulse 3s ease-in-out infinite",
        "scan":        "scan 2.5s ease-in-out infinite",
        "glow-cycle":  "glow-cycle 4s ease-in-out infinite",
      },
      keyframes: {
        scan: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "glow-cycle": {
          "0%,100%": { opacity: "0.4" },
          "50%":     { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
