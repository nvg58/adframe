import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        ui: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        reader: ['var(--font-bookerly)', 'Georgia', 'Times New Roman', 'serif'],
      },
      colors: {
        background: "var(--color-bg)",
        foreground: "var(--color-text)",
      },
      spacing: {
        'nav': '56px',
        'safe-nav': '72px',
      },
    },
  },
  plugins: [],
};
export default config;
