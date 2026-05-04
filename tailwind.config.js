/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "outline-variant": "#ccc3d8",
        "tertiary-container": "#666670",
        "on-primary": "#ffffff",
        "surface-tint": "#732ee4",
        "background": "#f8f9ff",
        "surface": "#f8f9ff",
        "inverse-surface": "#213145",
        "on-primary-container": "#ede0ff",
        "primary-fixed": "#eaddff",
        "tertiary-fixed-dim": "#c7c5d1",
        "surface-container-lowest": "#ffffff",
        "on-secondary-fixed": "#00164e",
        "error": "#ba1a1a",
        "secondary-container": "#8fa7fe",
        "primary-fixed-dim": "#d2bbff",
        "on-secondary": "#ffffff",
        "error-container": "#ffdad6",
        "on-background": "#0b1c30",
        "on-tertiary-fixed-variant": "#46464f",
        "on-error": "#ffffff",
        "secondary": "#4059aa",
        "secondary-fixed": "#dce1ff",
        "surface-bright": "#f8f9ff",
        "on-primary-fixed-variant": "#5a00c6",
        "on-primary-fixed": "#25005a",
        "on-secondary-container": "#1d3989",
        "surface-variant": "#d3e4fe",
        "on-error-container": "#93000a",
        "secondary-fixed-dim": "#b6c4ff",
        "surface-container-low": "#eff4ff",
        "surface-container-high": "#dce9ff",
        "surface-container": "#e5eeff",
        "outline": "#7b7487",
        "primary": "#630ed4",
        "on-tertiary-fixed": "#1a1b23",
        "tertiary-fixed": "#e3e1ed",
        "on-tertiary-container": "#e7e5f1",
        "on-surface-variant": "#4a4455",
        "surface-container-highest": "#d3e4fe",
        "surface-dim": "#cbdbf5",
        "inverse-primary": "#d2bbff",
        "on-tertiary": "#ffffff",
        "inverse-on-surface": "#eaf1ff",
        "primary-container": "#7c3aed",
        "on-surface": "#0b1c30",
        "tertiary": "#4e4e58",
        "on-secondary-fixed-variant": "#264191"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        sm: "8px",
        "container-padding": "20px",
        xs: "4px",
        lg: "24px",
        xl: "32px",
        base: "4px",
        "stack-gap": "12px",
        md: "16px"
      },
      fontFamily: {
        "label-caps": ["Inter", "sans-serif"],
        "h2": ["Inter", "sans-serif"],
        "h1": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "caption": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"]
      },
      fontSize: {
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
        "h2": ["20px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "h1": ["24px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "caption": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
