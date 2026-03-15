'use client'

import { useEffect, useRef } from 'react'

export default function AutoMarkRead({ itemId }: { itemId: string }) {
  const sentRef = useRef(false)
  const markerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = markerRef.current
    if (!el || sentRef.current) return

    const doMarkRead = () => {
      if (sentRef.current) return
      sentRef.current = true
      fetch(`/api/inbox/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' }),
      }).catch(() => {})
    }

    // Fallback: scroll listener for einkbro/old browsers without IntersectionObserver
    const useObserver = typeof IntersectionObserver !== 'undefined'

    if (useObserver) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) doMarkRead()
        },
        { threshold: 0.1 }
      )
      observer.observe(el)
      return () => observer.disconnect()
    }

    const check = () => {
      const rect = el.getBoundingClientRect()
      if (rect.top < (window as Window).innerHeight) doMarkRead()
    }
    ;(window as Window).addEventListener('scroll', check, { passive: true })
    check()
    return () => (window as Window).removeEventListener('scroll', check)
  }, [itemId])

  return <div ref={markerRef} style={{ height: '1px' }} />
}
