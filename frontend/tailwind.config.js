/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        risk: {
          low: '#10B981',        // Emerald 500
          moderate: '#F59E0B',   // Amber 500
          high: '#F97316',       // Orange 500
          veryhigh: '#EF4444',   // Red 500
          extreme: '#991B1B',    // Dark Red / Crimson 800
        },
        gov: {
          dark: '#0F172A',       // Slate 900
          navy: '#1E293B',       // Slate 800
          accent: '#0284C7',     // Sky 600
          gold: '#F59E0B',
        }
      }
    },
  },
  plugins: [],
}
