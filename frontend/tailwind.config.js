/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "oklch(0.28 0.18 290)",
          foreground: "oklch(1 0 0)",
          50: "oklch(0.96 0.03 290)",
          100: "oklch(0.92 0.06 290)",
          200: "oklch(0.85 0.10 290)",
          300: "oklch(0.72 0.15 290)",
          400: "oklch(0.58 0.19 290)",
          500: "oklch(0.45 0.22 290)",
          600: "oklch(0.38 0.20 290)",
          700: "oklch(0.28 0.18 290)",
          800: "oklch(0.22 0.14 290)",
          900: "oklch(0.16 0.10 290)",
        },
        secondary: {
          DEFAULT: "oklch(0.45 0.22 290)",
          foreground: "oklch(1 0 0)",
        },
        accent: {
          DEFAULT: "oklch(0.65 0.15 185)",
          foreground: "oklch(1 0 0)",
          teal: "oklch(0.65 0.15 185)",
        },
        gold: {
          DEFAULT: "oklch(0.72 0.14 75)",
          light: "oklch(0.95 0.05 75)",
          50: "oklch(0.97 0.03 75)",
        },
        muted: {
          DEFAULT: "oklch(0.94 0.01 280)",
          foreground: "oklch(0.5 0.05 280)",
        },
        destructive: {
          DEFAULT: "oklch(0.55 0.22 25)",
          foreground: "oklch(1 0 0)",
        },
        card: {
          DEFAULT: "oklch(1 0 0)",
          foreground: "oklch(0.15 0.02 280)",
        },
        popover: {
          DEFAULT: "oklch(1 0 0)",
          foreground: "oklch(0.15 0.02 280)",
        },
        success: "oklch(0.55 0.15 145)",
        warning: "oklch(0.72 0.18 65)",
        anthro: {
          purple: "#4C1D95",
          secondary: "#7C3AED",
          teal: "#00B3A4",
          gold: "#C9A227",
          bg: "#F7F7FB",
          dark: "#1E1B2E",
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.625rem",
        sm: "0.375rem",
        xl: "1rem",
        "2xl": "1.25rem",
        DEFAULT: "0.75rem",
      },
      boxShadow: {
        card: "0 2px 12px rgba(76, 29, 149, 0.08)",
        "card-hover": "0 4px 20px rgba(76, 29, 149, 0.15)",
        gold: "0 2px 12px rgba(201, 162, 39, 0.25)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
};
