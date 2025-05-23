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
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        'bubblegum': ['Bubblegum Sans', 'cursive'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        spellingsspel: {
          "primary": "#6366f1",        // Indigo voor hoofdknoppen
          "secondary": "#f472b6",      // Roze voor accent
          "accent": "#38bdf8",         // Hemelsblauw
          "neutral": "#1f2937",        // Donkergrijs
          "base-100": "#0f0f23",       // Donkere ruimte achtergrond
          "base-200": "#1e1e3f",       // Iets lichter
          "base-300": "#2d2d5a",       // Nog lichter
          "info": "#22d3ee",           // Cyan
          "success": "#4ade80",        // Groen voor juiste antwoorden
          "warning": "#facc15",        // Geel voor waarschuwingen
          "error": "#ef4444",          // Rood voor foute antwoorden
        },
      },
      "light", // Fallback voor ouderportaal
    ],
  },
}

export default config;
