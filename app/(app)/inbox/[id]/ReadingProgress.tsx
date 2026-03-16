'use client'

import { useEffect, useState, useRef } from 'react'

/**
 * Kindle-style reading progress bar + time left.
 * Sits at the very bottom of the viewport as a thin bar.
 */
export default function ReadingProgress({ wordCount }: { wordCount: number }) {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef(0)

  // Average reading speed ~200 wpm
  const totalMinutes = Math.max(1, Math.ceil(wordCount / 200))

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) {
        setProgress(100)
        return
      }
      const pct = Math.min(100, Math.round((scrollTop / docHeight) * 100))
      setProgress(pct)
    }

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update() // initial
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const minutesLeft = Math.max(0, Math.ceil(totalMinutes * (1 - progress / 100)))

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
      backgroundColor: '#fff', borderTop: '1px solid #f3f4f6',
      padding: '6px 16px 8px',
    }}>
      {/* Progress bar */}
      <div style={{
        height: '3px', backgroundColor: '#e5e7eb', borderRadius: '2px',
        overflow: 'hidden', marginBottom: '4px',
      }}>
        <div style={{
          height: '100%', backgroundColor: '#6b7280', borderRadius: '2px',
          width: `${progress}%`,
        }} />
      </div>
      {/* Text: percentage left + time */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: '11px', color: '#9ca3af', lineHeight: 1,
      }}>
        <span>{progress}%</span>
        <span>
          {minutesLeft === 0
            ? 'Done'
            : `${minutesLeft} min left`}
        </span>
      </div>
    </div>
  )
}
