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

  // Load from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('adframe-reader-theme') as Theme
    const savedSize = localStorage.getItem('adframe-reader-font-size') as FontSize
    if (savedTheme) setThemeState(savedTheme)
    if (savedSize) setFontSizeState(savedSize)
  }, [])

  // Apply theme to <html>
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('dark')

    if (theme === 'dark') {
      html.classList.add('dark')
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) html.classList.add('dark')
    }
  }, [theme])

  // Apply font size as CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--reader-font-size', fontSizeMap[fontSize])
  }, [fontSize])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem('adframe-reader-theme', t)
  }

  const setFontSize = (s: FontSize) => {
    setFontSizeState(s)
    localStorage.setItem('adframe-reader-font-size', s)
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
