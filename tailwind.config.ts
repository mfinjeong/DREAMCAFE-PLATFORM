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
        background: "#0b0e14",
        surface: {
          DEFAULT: "#111622",
          elevated: "#161d2d",
          hover: "#1b2336",
        },
        card: {
          DEFAULT: "#131926",
          border: "#1e293b",
          hover: "#182030",
        },
        accent: {
          DEFAULT: "#dc2626", // subtle red accent
          hover: "#b91c1c",
          muted: "#991b1b",
          subtle: "rgba(220, 38, 38, 0.12)",
          glow: "rgba(220, 38, 38, 0.25)",
        },
        status: {
          available: "#10b981", // emerald
          inuse: "#3b82f6",     // blue
          maintenance: "#f59e0b", // amber
          offline: "#6b7280",   // gray
        },
        charcoal: {
          900: "#090c10",
          800: "#0d1117",
          700: "#161b22",
          600: "#21262d",
          500: "#30363d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
