import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", md: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
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
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // Legacy names remapped to the light palette.
        ink: {
          950: "#FFFFFF",
          900: "#FAFAFA",
          800: "#F4F4F5",
          700: "#E4E4E7",
        },
        neon: {
          violet: "#4F46E5",
          pink: "#6366F1",
          amber: "#D97706",
        },
        facebook: "#1877F2",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      backgroundImage: {
        "neon-gradient": "linear-gradient(#4F46E5, #4F46E5)",
        "neon-gradient-soft": "linear-gradient(rgba(79,70,229,.08), rgba(79,70,229,.08))",
        "glass-sheen": "none",
      },
      boxShadow: {
        glow: "0 1px 2px rgba(16,24,40,0.05), 0 4px 16px -4px rgba(16,24,40,0.10)",
        "glow-pink": "0 1px 2px rgba(16,24,40,0.05), 0 4px 16px -4px rgba(16,24,40,0.10)",
        "glow-amber": "0 1px 2px rgba(16,24,40,0.05), 0 4px 16px -4px rgba(16,24,40,0.10)",
        glass: "0 1px 2px rgba(16,24,40,0.04)",
      },
      keyframes: {
        "eq-bar": {
          "0%, 100%": { transform: "scaleY(0.25)" },
          "50%": { transform: "scaleY(1)" },
        },
        "live-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(236,72,153,0.7)" },
          "70%": { boxShadow: "0 0 0 8px rgba(236,72,153,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(236,72,153,0)" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "0.45" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "eq-bar": "eq-bar 1s ease-in-out infinite",
        "live-pulse": "live-pulse 1.8s infinite",
        "gradient-pan": "gradient-pan 8s ease infinite",
        ripple: "ripple 650ms ease-out forwards",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin-slow 12s linear infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;
