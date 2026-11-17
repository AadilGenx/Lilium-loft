/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontSize: {
        '2xs': ['0.75rem', { lineHeight: '1rem' }],       // 12px
        'xs': ['0.875rem', { lineHeight: '1.25rem' }],    // 14px (changed from 12px to 14px)
        'sm': ['0.9375rem', { lineHeight: '1.375rem' }],  // 15px
      },
      colors: {
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#64748b', // shifted from light #94a3b8 to readable darker gray #64748b
          500: '#475569', // shifted from #64748b to darker gray #475569
          600: '#334155', // shifted from #475569 to darker deep slate #334155
          700: '#1e293b',
          800: '#0f172a',
          900: '#020617',
        },
        gray: {
          400: '#6b7280',
          500: '#4b5563',
          600: '#374151',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        red: {
          50: '#FDF2F7',  // soft petal pink
          100: '#FCE7F1', // light rose
          200: '#F9CFE3',
          300: '#F4A6CA',
          400: '#E7548A',
          500: '#C2185B', // vibrant lily petal crimson
          600: '#8A1538', // signature Lilium wine / plum
          700: '#710E2C', // deep velvet plum
          800: '#55081F',
          900: '#3D0415',
        },
        primary: {
          DEFAULT: "#8A1538", // Signature Lilium wine
          foreground: "#FFFFFF",
          50: "#FDF2F7",
          100: "#FCE7F1",
          200: "#F9CFE3",
          300: "#F4A6CA",
          400: "#E7548A",
          500: "#C2185B",
          600: "#8A1538",
          700: "#710E2C",
          800: "#55081F",
          900: "#3D0415",
        },
        brand: {
          wine: "#8A1538",
          crimson: "#C2185B",
          amber: "#D97706",
          gold: "#F59E0B",
          plum: "#4A071E",
          honey: "#FFFBEB",
          olive: "#65A30D",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

