/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FDFBF7",
        card: "#ffffff",
        foreground: "#0f172a",
        "muted-foreground": "#64748b",
        muted: "#f1f5f9",
        border: "#e2e8f0",
        primary: "#4F46E5",
        "primary-foreground": "#ffffff",
        success: "#22c55e",
        destructive: "#ef4444",
      },
      keyframes: {
        "drone-fly": {
          "0%": { transform: "translateX(-20px) translateY(0px) rotate(-5deg)" },
          "25%": { transform: "translateX(5px) translateY(-8px) rotate(2deg)" },
          "50%": { transform: "translateX(20px) translateY(-2px) rotate(-2deg)" },
          "75%": { transform: "translateX(5px) translateY(-10px) rotate(3deg)" },
          "100%": { transform: "translateX(-20px) translateY(0px) rotate(-5deg)" },
        },
      },
      animation: {
        "drone-fly": "drone-fly 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}