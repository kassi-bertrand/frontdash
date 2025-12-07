'use client'

import * as React from 'react'

type ThemeConfig = {
  activeTheme: string
  setActiveTheme: (theme: string) => void
}

const ThemeConfigContext = React.createContext<ThemeConfig | null>(null)

export function ThemeConfigProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveTheme] = React.useState('default')

  return (
    <ThemeConfigContext.Provider value={{ activeTheme, setActiveTheme }}>
      {children}
    </ThemeConfigContext.Provider>
  )
}

export function useThemeConfig(): ThemeConfig {
  const context = React.useContext(ThemeConfigContext)
  if (!context) {
    throw new Error('useThemeConfig must be used within a ThemeConfigProvider')
  }
  return context
}
