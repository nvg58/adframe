'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'
type FontSize = 'small' | 'normal' | 'medium'

const fontSizeMap: Record<FontSize, string> = {
  small: '16px',
  normal: '18px',
  medium: '20px',
}

interface ReaderSettings {
  theme: Theme
  fontSize: FontSize
  setTheme: (t: Theme) => void
  setFontSize: (s: FontSize) => void
}

const ReaderSettingsContext = createContext<ReaderSettings>({
  theme: 'light',
  fontSize: 'normal',
  setTheme: () => {},
  setFontSize: () => {},
})

export function ReaderSettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [fontSize, setFontSizeState] = useState<FontSize>('normal')

  // Load from localStorage on mount (with defensive guard)
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('adframe-reader-theme') as Theme
      const savedSize = localStorage.getItem('adframe-reader-font-size') as FontSize
      if (savedTheme) setThemeState(savedTheme)
      if (savedSize) setFontSizeState(savedSize)
    } catch {
      // localStorage not available (e.g. einkbro privacy mode)
    }
  }, [])

  // Apply theme to <html>
  useEffect(() => {
    try {
      const html = document.documentElement
      html.classList.remove('dark')

      if (theme === 'dark') {
        html.classList.add('dark')
      } else if (theme === 'system') {
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
        if (prefersDark) html.classList.add('dark')
      }
    } catch {
      // matchMedia not available
    }
  }, [theme])

  // Apply font size as CSS variable
  useEffect(() => {
    try {
      document.documentElement.style.setProperty('--reader-font-size', fontSizeMap[fontSize])
    } catch {
      // style not available
    }
  }, [fontSize])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    try { localStorage.setItem('adframe-reader-theme', t) } catch {}
  }

  const setFontSize = (s: FontSize) => {
    setFontSizeState(s)
    try { localStorage.setItem('adframe-reader-font-size', s) } catch {}
  }

  return (
    <ReaderSettingsContext.Provider value={{ theme, fontSize, setTheme, setFontSize }}>
      {children}
    </ReaderSettingsContext.Provider>
  )
}

export function useReaderSettings() {
  return useContext(ReaderSettingsContext)
}
