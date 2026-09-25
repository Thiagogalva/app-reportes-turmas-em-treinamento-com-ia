import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
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
        // Paleta oficial e variações Bradesco
        bradesco: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#cc092f', // Vermelho Bradesco Principal
          700: '#b50729', // Vermelho Bradesco Escuro
          800: '#940520',
          900: '#730318',
          950: '#4c010e',
        },
        dark: {
          bg: '#0a0d14',        // Fundo principal escuro profundo
          surface: '#111622',   // Fundo de cards e seções
          card: '#161c2b',      // Superfície elevada de cards
          border: '#232b3e',    // Bordas sutis
          borderHover: '#333e56',
          input: '#0d111a',     // Fundo de campos de texto
          muted: '#8e9bb0',     // Textos secundários
          text: '#f1f5f9',      // Texto principal
        }
      },
    },
  },
  plugins: [],
};
export default config;
