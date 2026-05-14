/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
      },
      backgroundImage: {
        // Dark Gray Gradient - Primary actions
        "gradient-dark":
          "linear-gradient(135deg, #4b5563 0%, #374151 50%, #1f2937 100%)",

        // Medium Gray Gradient - Secondary actions
        "gradient-medium":
          "linear-gradient(135deg, #6b7280 0%, #4b5563 50%, #374151 100%)",

        // Light Gray Gradient - Subtle actions
        "gradient-light":
          "linear-gradient(135deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%)",

        // Warm Gray Gradient - Voice/Special
        "gradient-warm":
          "linear-gradient(135deg, #78716c 0%, #57534e 50%, #44403c 100%)",

        // Cool Gray Gradient - AI/Tech
        "gradient-cool":
          "linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%)",

        // Subtle Gray Gradient - Secondary actions
        "gradient-subtle":
          "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 50%, #9ca3af 100%)",

        // Danger Gradient - Delete/Clear actions
        "gradient-danger":
          "linear-gradient(135deg, #9ca3af 0%, #6b7280 50%, #4b5563 100%)",

        // Select Dropdown Gradient
        "gradient-select":
          "linear-gradient(135deg, #5a6570 0%, #475569 50%, #374151 100%)",

        // Hover variants
        "gradient-dark-hover":
          "linear-gradient(135deg, #5a6570 0%, #475569 50%, #2d3a4e 100%)",
        "gradient-medium-hover":
          "linear-gradient(135deg, #7c828f 0%, #5a6570 50%, #475569 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-in": "slideIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideIn: {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-rtl")],
};
