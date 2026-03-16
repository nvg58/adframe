'use client'

import { useEffect, useState, useRef } from 'react'

const WPM_KEY = 'adframe-reading-wpm'
const DEFAULT_WPM = 200

/**
 * Kindle-style reading progress bar with adaptive time estimate.
 *
 * Tracks how many words the user has scrolled past over time,
 * calculates their actual reading speed (WPM), and persists it
 * across sessions via localStorage. Uses the real WPM to estimate
 * time remaining for the unread portion.
 */
export default function ReadingProgress({ wordCount }: { wordCount: number }) {
  const [progress, setProgress] = useState(0)
  const [minutesLeft, setMinutesLeft] = useState(0)
  const rafRef = useRef(0)

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

    // Set initial time estimate
    setMinutesLeft(Math.max(1, Math.ceil(wordCount / wpmRef.current)))

    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) {
        setProgress(100)
        setMinutesLeft(0)
        return
      }

      const pct = Math.min(100, Math.round((scrollTop / docHeight) * 100))
      setProgress(pct)

      const now = Date.now()

      // Start tracking on first scroll movement
      if (!hasMovedRef.current && pct > 0) {
        hasMovedRef.current = true
        startTimeRef.current = now
        startProgressRef.current = pct
      }

      // Calculate adaptive WPM after enough reading (at least 10% progress and 10s)
      if (hasMovedRef.current && startTimeRef.current > 0) {
        const elapsedMin = (now - startTimeRef.current) / 60000
        const progressDelta = pct - startProgressRef.current

        if (elapsedMin >= 0.17 && progressDelta >= 5) {
          // Words read = fraction of total word count
          const wordsRead = (progressDelta / 100) * wordCount
          const measuredWpm = wordsRead / elapsedMin

          // Clamp to reasonable range and blend with saved WPM for stability
          if (measuredWpm > 20 && measuredWpm < 1500) {
            // Exponential moving average: 70% measured, 30% previous
            wpmRef.current = measuredWpm * 0.7 + wpmRef.current * 0.3

            try {
              localStorage.setItem(WPM_KEY, String(Math.round(wpmRef.current)))
            } catch {}
          }
        }
      }

      // Estimate time left using current WPM
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
    }
  }, [wordCount])

  return (
    <div style={{
      maxWidth: '640px', margin: '0 auto',
      padding: '12px 20px 16px',
      borderTop: '1px solid #f3f4f6',
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
      {/* Text: percentage + time */}
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
