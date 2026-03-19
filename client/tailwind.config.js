export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0a0f1e', 800: '#0d1428', 700: '#111b35' },
        purple: { deep: '#1a0a2e', electric: '#7c3aed' },
        teal: { DEFAULT: '#0d9488' },
        amber: { DEFAULT: '#d97706' },
        coral: { DEFAULT: '#dc2626' },
        type: {
          Fire: '#ef4444', Water: '#3b82f6', Wind: '#10b981', Earth: '#84cc16',
          Thunder: '#eab308', Ice: '#67e8f9', Shadow: '#8b5cf6', Light: '#fbbf24',
          Poison: '#a855f7', Metal: '#9ca3af', Psychic: '#ec4899', Nature: '#22c55e'
        }
      },
      fontFamily: {
        display: ['"Cinzel Decorative"', 'serif'],
        body: ['"Exo 2"', 'sans-serif'],
      }
    }
  },
  plugins: []
}
