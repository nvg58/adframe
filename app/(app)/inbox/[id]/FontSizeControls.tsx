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

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <button
        onClick={() => change(-1)}
        disabled={isMin}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '36px', height: '36px',
          border: '1px solid #d1d5db', borderRadius: '8px',
          backgroundColor: '#fff', color: '#374151',
          cursor: isMin ? 'default' : 'pointer', padding: 0,
          opacity: isMin ? 0.3 : 1,
        }}
        title="Smaller text"
        aria-label="Decrease font size"
      >
        <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'Georgia, serif' }}>A</span>
      </button>
      <button
        onClick={() => change(1)}
        disabled={isMax}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '36px', height: '36px',
          border: '1px solid #d1d5db', borderRadius: '8px',
          backgroundColor: '#fff', color: '#374151',
          cursor: isMax ? 'default' : 'pointer', padding: 0,
          opacity: isMax ? 0.3 : 1,
        }}
        title="Larger text"
        aria-label="Increase font size"
      >
        <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Georgia, serif' }}>A</span>
      </button>
    </div>
  )
}
