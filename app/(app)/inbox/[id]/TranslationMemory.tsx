'use client'

import { useEffect } from 'react'

const KEY_PREFIX = 'adframe-translate-'

export default function TranslationMemory({
  itemId,
  isOn,
}: {
  itemId: string
  isOn: boolean
}) {
  useEffect(() => {
    // Save current translation state
    try {
      localStorage.setItem(KEY_PREFIX + itemId, isOn ? '1' : '0')
    } catch {}
  }, [itemId, isOn])

  useEffect(() => {
    // On mount, if saved state differs from URL, redirect
    try {
      const saved = localStorage.getItem(KEY_PREFIX + itemId)
      if (saved === '1' && !isOn) {
        window.location.replace(`/inbox/${itemId}?translate=true`)
      }
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
