'use client'

import { useEffect, useState } from 'react'

const PROGRESS_PREFIX = 'adframe-progress-'

/**
 * Reads saved reading progress from localStorage for a list of item IDs.
 * Renders a small progress indicator next to each item.
 */
export default function ItemProgress({ itemId }: { itemId: string }) {
  const [pct, setPct] = useState<number | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROGRESS_PREFIX + itemId)
      if (saved) {
        const val = parseInt(saved, 10)
        if (val > 0 && val <= 100) setPct(val)
      }
    } catch {}
  }, [itemId])

  if (pct === null || pct === 0) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
      {/* Mini progress bar */}
      <div style={{
        flex: 1, height: '3px', backgroundColor: '#e5e7eb',
        borderRadius: '2px', overflow: 'hidden', maxWidth: '80px',
      }}>
        <div style={{
          height: '100%', borderRadius: '2px',
          backgroundColor: pct >= 100 ? '#22c55e' : '#6b7280',
          width: `${pct}%`,
        }} />
      </div>
      <span style={{
        fontSize: '11px', color: pct >= 100 ? '#22c55e' : '#9ca3af',
        fontWeight: 500,
      }}>
        {pct >= 100 ? 'Done' : `${pct}%`}
      </span>
    </div>
  )
}
