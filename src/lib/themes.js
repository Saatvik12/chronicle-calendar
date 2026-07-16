// Each theme is a set of CSS custom properties applied to :root.
// Colors are stored as "R G B" triplets (no commas) so Tailwind's
// `rgb(var(--x) / <alpha-value>)` pattern can control opacity.

export const THEMES = {
  minimalist_light: {
    label: 'Minimalist Light',
    description: 'Stone paper, ink-blue accent, quiet and precise.',
    swatch: '#3654A6',
    vars: {
      '--color-surface': '250 249 246',
      '--color-surface-raised': '255 255 255',
      '--color-surface-sunken': '241 239 233',
      '--color-border': '223 219 209',
      '--color-ink': '31 29 26',
      '--color-ink-muted': '111 107 98',
      '--color-accent': '54 84 166',
      '--color-accent-soft': '223 229 245',
      '--radius-card': '14px',
    },
  },
  modern_dark: {
    label: 'Modern Dark',
    description: 'Near-black slate with a brass, clockwork accent.',
    swatch: '#C79A4B',
    vars: {
      '--color-surface': '20 20 22',
      '--color-surface-raised': '29 29 32',
      '--color-surface-sunken': '14 14 16',
      '--color-border': '46 46 50',
      '--color-ink': '236 234 228',
      '--color-ink-muted': '150 148 142',
      '--color-accent': '199 154 75',
      '--color-accent-soft': '54 46 27',
      '--radius-card': '14px',
    },
  },
  pastel_mint: {
    label: 'Pastel Mint',
    description: 'Soft sage paper with a deep forest accent.',
    swatch: '#2F6B4F',
    vars: {
      '--color-surface': '243 248 244',
      '--color-surface-raised': '253 255 253',
      '--color-surface-sunken': '229 240 232',
      '--color-border': '204 224 210',
      '--color-ink': '27 41 33',
      '--color-ink-muted': '92 112 99',
      '--color-accent': '47 107 79',
      '--color-accent-soft': '215 235 222',
      '--radius-card': '16px',
    },
  },
  royal_amethyst: {
    label: 'Royal Amethyst',
    description: 'Deep plum ground with a warm gold accent.',
    swatch: '#C9A54D',
    vars: {
      '--color-surface': '30 21 38',
      '--color-surface-raised': '40 29 50',
      '--color-surface-sunken': '23 16 30',
      '--color-border': '61 45 74',
      '--color-ink': '237 230 240',
      '--color-ink-muted': '166 152 176',
      '--color-accent': '201 165 77',
      '--color-accent-soft': '58 45 30',
      '--radius-card': '14px',
    },
  },
}

export const THEME_KEYS = Object.keys(THEMES)

export function applyTheme(themeKey) {
  const theme = THEMES[themeKey] || THEMES.minimalist_light
  const root = document.documentElement
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  root.style.setProperty('--font-display', "'Fraunces', serif")
  root.style.setProperty('--font-body', "'Inter', sans-serif")
  root.dataset.theme = themeKey
}
