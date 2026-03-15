'use client'

import { useEffect, useState } from 'react'

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}) {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    if (open) {
      const y = window.scrollY || window.pageYOffset || 0
      setScrollY(y)
      try { document.body.style.overflow = 'hidden' } catch {}
      // Debug log
      try {
        const el = document.getElementById('adframe-debug')
        if (el) el.textContent += `\n[BottomSheet] open=true scrollY=${y} title="${title}"`
      } catch {}
    } else {
      try { document.body.style.overflow = '' } catch {}
    }
    return () => {
      try { document.body.style.overflow = '' } catch {}
    }
  }, [open, title])

  if (!open) return null

  return (
    // Use absolute positioning instead of fixed (fixed breaks on einkbro)
    <div
      style={{
        position: 'absolute',
        top: `${scrollY}px`,
        left: 0,
        right: 0,
        height: '100vh',
        zIndex: 50,
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
      />

      {/* Sheet */}
      <div
        className="bg-white dark:bg-[#262626] rounded-t-2xl flex flex-col"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: '70vh',
          paddingBottom: 'calc(var(--bottom-nav-height, 56px) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Title */}
        {title && (
          <div className="flex items-center justify-between px-5 pb-3">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <button onClick={onClose} className="p-1 text-gray-400 dark:text-gray-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-5 pb-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
