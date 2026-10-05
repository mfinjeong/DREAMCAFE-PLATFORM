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
        background: "#0c0d11", // Deep dark charcoal, not pure black
        surface: {
          DEFAULT: "#13151b",  // Primary container surface
          muted: "#181a22",    // Subtle elevated background
          hover: "#1e212b",    // Hover state
          border: "#242735",   // Clean structural border
        },
        accent: {
          DEFAULT: "#c52222",  // Deep subtle crimson red
          hover: "#a81919",
          active: "#8f1212",
          subtle: "#1c1214",   // Subtle tinted container background
          border: "#3d1a1e",   // Subtle red border
        },
        typography: {
          primary: "#f4f4f6",   // High-contrast clean white
          secondary: "#8f94a3", // Balanced gray secondary
          muted: "#5a5e6d",     // Low-contrast metadata
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          '"SF Mono"',
          "Consolas",
          '"Liberation Mono"',
          "Menlo",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
