/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#C62828", // Deep Bayon Red
          dark: "#991B1B",
          light: "#F87171",
          accent: "#AD1457", // Silk Pink
        },
        neutral: {
          50: "#F9FAFB", // Soft Paper White
          100: "#F3F4F6",
          200: "#E5E7EB", // Stone Gray
          900: "#111827",
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
