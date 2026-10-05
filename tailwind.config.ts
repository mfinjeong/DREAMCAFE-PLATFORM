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
        background: "#0D0E10", // Dark charcoal base, not pure black
        surface: {
          DEFAULT: "#15171A",  // Clean neutral card / container surface
          subtle: "#111317",   // Sidebar / topbar surface
          hover: "#1A1D22",    // Hover surface
          border: "#22252A",   // Subtle gray structural border
        },
        accent: {
          DEFAULT: "#B4232A",  // Restrained dark red
          hover: "#961C22",
          active: "#7F171C",
          subtle: "#1E1214",   // Subtle dark red background for active states
          border: "#3B1C20",   // Subtle red border
        },
        typography: {
          primary: "#EDEDEE",   // Clean off-white
          secondary: "#8A909A", // Muted neutral gray
          muted: "#585C66",     // Low-contrast metadata
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
