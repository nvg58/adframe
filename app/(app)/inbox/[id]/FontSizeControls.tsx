'use client'

import { useState, useEffect } from 'react'

const FONT_SIZES = [14, 16, 18, 20, 22, 24]
const DEFAULT_SIZE = 16
const STORAGE_KEY = 'adframe-reader-font-size'

export default function FontSizeControls() {
  const [fontSize, setFontSize] = useState(DEFAULT_SIZE)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const size = parseInt(saved, 10)
      if (FONT_SIZES.includes(size)) {
        setFontSize(size)
        document.documentElement.style.setProperty('--reader-font-size', `${size}px`)
      }
    }
  }, [])

  const change = (delta: number) => {
    const idx = FONT_SIZES.indexOf(fontSize)
    const next = FONT_SIZES[idx + delta]
    if (next != null) {
      setFontSize(next)
      localStorage.setItem(STORAGE_KEY, String(next))
      document.documentElement.style.setProperty('--reader-font-size', `${next}px`)
    }
  }

  const isMin = fontSize === FONT_SIZES[0]
  const isMax = fontSize === FONT_SIZES[FONT_SIZES.length - 1]

  const btnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '32px', height: '32px',
    border: '1px solid #d1d5db', borderRadius: '6px',
    backgroundColor: '#fff', color: '#374151',
    cursor: 'pointer', padding: 0,
  }

  const disabledStyle: React.CSSProperties = {
    ...btnStyle,
    opacity: 0.3, cursor: 'default',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      <button
        onClick={() => change(-1)}
        disabled={isMin}
        style={isMin ? disabledStyle : btnStyle}
        title="Smaller text"
        aria-label="Decrease font size"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <text x="4" y="19" fontSize="11" fontWeight="bold" fill="currentColor">A</text>
        </svg>
      </button>
      <button
        onClick={() => change(1)}
        disabled={isMax}
        style={isMax ? disabledStyle : btnStyle}
        title="Larger text"
        aria-label="Increase font size"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <text x="2" y="19" fontSize="18" fontWeight="bold" fill="currentColor">A</text>
        </svg>
      </button>
    </div>
  )
}
