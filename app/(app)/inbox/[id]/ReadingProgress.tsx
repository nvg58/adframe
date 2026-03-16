'use client'

import { useEffect, useState, useRef } from 'react'

const WPM_KEY = 'adframe-reading-wpm'
const PROGRESS_PREFIX = 'adframe-progress-'
const DEFAULT_WPM = 200

export default function ReadingProgress({ wordCount, itemId }: { wordCount: number; itemId: string }) {
  const [progress, setProgress] = useState(0)
  const [minutesLeft, setMinutesLeft] = useState(0)
  const rafRef = useRef(0)
  const saveTimerRef = useRef(0)
  const restoredRef = useRef(false)

  // Tracking refs for adaptive speed
  const startTimeRef = useRef(0)
  const startProgressRef = useRef(0)
  const wpmRef = useRef(DEFAULT_WPM)
  const hasMovedRef = useRef(false)

  useEffect(() => {
    // Load persisted WPM
    try {
      const saved = localStorage.getItem(WPM_KEY)
      if (saved) {
        const parsed = parseFloat(saved)
        if (parsed > 20 && parsed < 1500) wpmRef.current = parsed
      }
    } catch {}

    // Restore scroll position for this item
    try {
      const savedProgress = localStorage.getItem(PROGRESS_PREFIX + itemId)
      if (savedProgress && !restoredRef.current) {
        restoredRef.current = true
        const pct = parseInt(savedProgress, 10)
        if (pct > 5 && pct < 100) {
          // Delay to let layout settle, then scroll to saved position
          requestAnimationFrame(() => {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight
            if (docHeight > 0) {
              window.scrollTo(0, (pct / 100) * docHeight)
            }
          })
        }
      }
    } catch {}

    // Set initial time estimate
    setMinutesLeft(Math.max(1, Math.ceil(wordCount / wpmRef.current)))

    const saveProgress = (pct: number) => {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = window.setTimeout(() => {
        try {
          localStorage.setItem(PROGRESS_PREFIX + itemId, String(pct))
        } catch {}
      }, 500)
    }

    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) {
        setProgress(100)
        setMinutesLeft(0)
        saveProgress(100)
        return
      }

      const pct = Math.min(100, Math.round((scrollTop / docHeight) * 100))
      setProgress(pct)
      saveProgress(pct)

      const now = Date.now()

      if (!hasMovedRef.current && pct > 0) {
        hasMovedRef.current = true
        startTimeRef.current = now
        startProgressRef.current = pct
      }

      if (hasMovedRef.current && startTimeRef.current > 0) {
        const elapsedMin = (now - startTimeRef.current) / 60000
        const progressDelta = pct - startProgressRef.current

        if (elapsedMin >= 0.17 && progressDelta >= 5) {
          const wordsRead = (progressDelta / 100) * wordCount
          const measuredWpm = wordsRead / elapsedMin

          if (measuredWpm > 20 && measuredWpm < 1500) {
            wpmRef.current = measuredWpm * 0.7 + wpmRef.current * 0.3
            try {
              localStorage.setItem(WPM_KEY, String(Math.round(wpmRef.current)))
            } catch {}
          }
        }
      }

      const wordsLeft = ((100 - pct) / 100) * wordCount
      const mins = Math.ceil(wordsLeft / wpmRef.current)
      setMinutesLeft(pct >= 100 ? 0 : Math.max(0, mins))
    }

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafRef.current)
      clearTimeout(saveTimerRef.current)
    }
  }, [wordCount, itemId])

  return (
    <div style={{
      maxWidth: '640px', margin: '0 auto',
      padding: '12px 20px 16px',
      borderTop: '1px solid #f3f4f6',
    }}>
      <div style={{
        height: '3px', backgroundColor: '#e5e7eb', borderRadius: '2px',
        overflow: 'hidden', marginBottom: '4px',
      }}>
        <div style={{
          height: '100%', backgroundColor: '#6b7280', borderRadius: '2px',
          width: `${progress}%`,
        }} />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: '11px', color: '#9ca3af', lineHeight: 1,
      }}>
        <span>{progress}%</span>
        <span>
          {minutesLeft === 0 ? 'Done' : `${minutesLeft} min left`}
        </span>
      </div>
    </div>
  )
}
