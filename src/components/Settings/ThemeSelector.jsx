import { Check } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function ThemeSelector() {
  const { themeKey, setTheme, themes } = useTheme()

  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(themes).map(([key, theme]) => {
        const active = key === themeKey
        return (
          <button
            key={key}
            onClick={() => setTheme(key)}
            className={`text-left rounded-card border p-3 transition-colors ${
              active ? 'border-accent' : 'border-border hover:border-ink-muted'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="h-5 w-5 rounded-full border border-black/10"
                style={{ backgroundColor: theme.swatch }}
              />
              {active && <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2} />}
            </div>
            <p className="text-sm font-medium text-ink">{theme.label}</p>
            <p className="text-xs text-ink-muted mt-0.5 leading-snug">{theme.description}</p>
          </button>
        )
      })}
    </div>
  )
}
