import { createContext, useContext, useEffect, useState } from 'react'
import { applyTheme, THEMES } from '../lib/themes'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const { profile, session, refreshProfile } = useAuth()
  const [themeKey, setThemeKey] = useState('minimalist_light')

  // Apply immediately on load / whenever profile.theme changes
  useEffect(() => {
    const key = profile?.theme || 'minimalist_light'
    setThemeKey(key)
    applyTheme(key)
  }, [profile?.theme])

  const setTheme = async (key) => {
    setThemeKey(key)
    applyTheme(key) // instant visual feedback, no flash
    if (session?.user) {
      await supabase.from('profiles').update({ theme: key }).eq('id', session.user.id)
      refreshProfile()
    }
  }

  return (
    <ThemeContext.Provider value={{ themeKey, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
