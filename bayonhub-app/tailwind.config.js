/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#E53935",
          dark: "#B71C1C",
          light: "#EF9A9A"
        },
        neutral: {
          50: "#FAFAFA",
          900: "#0A0A0A"
        }
      },
      fontFamily: {
        khmer: ["Noto Sans Khmer", "sans-serif"],
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      screens: {
        xs: "390px",
      },
      animation: {
        shimmer: "shimmer 1.8s linear infinite",
        heartBurst: "heartBurst 0.5s ease forwards",
        fadeUp: "fadeUp 0.4s ease forwards",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        heartBurst: {
          "0%": { transform: "scale(0)" },
          "70%": { transform: "scale(1.4)" },
          "100%": { transform: "scale(1)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}
