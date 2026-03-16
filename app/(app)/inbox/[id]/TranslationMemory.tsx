'use client'

import { useEffect, useRef } from 'react'

const KEY_PREFIX = 'adframe-translate-'

export default function TranslationMemory({
  itemId,
  isOn,
}: {
  itemId: string
  isOn: boolean
}) {
  const checkedRef = useRef(false)

  useEffect(() => {
    // On first mount, check if we should redirect to enable translation
    if (checkedRef.current) return
    checkedRef.current = true

    try {
      const saved = localStorage.getItem(KEY_PREFIX + itemId)
      if (saved === '1' && !isOn) {
        // Preserve existing search params (like ?export=true)
        const url = new URL(window.location.href)
        url.searchParams.set('translate', 'true')
        window.location.replace(url.toString())
        return // Don't save — we're redirecting
      }
    } catch {}

    // Save current state only after redirect check
    try {
      localStorage.setItem(KEY_PREFIX + itemId, isOn ? '1' : '0')
    } catch {}
  }, [itemId, isOn])

  return null
}
