/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],

  theme: {
    extend: {
      colors: {
        brand: {
          /* Fondo general */
          bg: "#FFF1EC",

          /* Tarjetas y superficies */
          surface: "#FFFFFF",

          /* Color principal (acciones importantes) */
          primary: "#F4A6B8",
          primaryHover: "#F08CA4",

          /* Bordes suaves */
          border: "#EAD1D9",

          /* Textos */
          text: "#2E2E2E",
          muted: "#6B6B6B",

          /* Estados */
          danger: "#E53935",
          success: "#43A047",
          warning: "#FB8C00",
        },
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },

      boxShadow: {
        soft: "0 4px 12px rgba(0,0,0,0.06)",
        card: "0 8px 20px rgba(0,0,0,0.08)",
      },

      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
      },
    },
  },

  plugins: [],
};
