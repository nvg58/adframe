'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MenuItem {
  label: string
  icon: React.ReactNode
  onClick: () => void
  destructive?: boolean
}

interface HeaderAction {
  icon: React.ReactNode
  onClick: () => void
  active?: boolean
  label: string
}

export default function ReaderHeader({
  menuItems = [],
  actions = [],
}: {
  menuItems?: MenuItem[]
  actions?: HeaderAction[]
}) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 h-12">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-10 h-10 -ml-2 text-gray-700 dark:text-gray-300"
          aria-label="Go back"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="flex items-center gap-1">
        {/* Quick action buttons */}
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className={`flex items-center justify-center w-10 h-10 rounded-lg ${
              action.active
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            aria-label={action.label}
          >
            {action.icon}
          </button>
        ))}

        {/* Three-dot menu */}
        {menuItems.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center w-10 h-10 -mr-2 text-gray-700 dark:text-gray-300"
              aria-label="Menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-[#262626] rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50">
                  {menuItems.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setMenuOpen(false)
                        item.onClick()
                      }}
                      className={`flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 ${
                        item.destructive
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className={item.destructive ? 'text-red-400 dark:text-red-500' : 'text-gray-400 dark:text-gray-500'}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </header>
  )
}
