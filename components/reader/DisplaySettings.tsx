'use client'

import { useReaderSettings } from '@/lib/reader-settings'
import BottomSheet from '@/components/ui/BottomSheet'

export default function DisplaySettings({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { theme, fontSize, setTheme, setFontSize } = useReaderSettings()

  return (
    <BottomSheet open={open} onClose={onClose} title="Display">
      <div className="space-y-6">
        {/* Theme */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'light' as const, label: 'Light', icon: '☀️' },
              { value: 'dark' as const, label: 'Dark', icon: '🌙' },
              { value: 'system' as const, label: 'System', icon: '💻' },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-medium  ${
                  theme === opt.value
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-600'
                }`}
              >
                <span className="text-lg">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Font Size</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'small' as const, label: 'Small', size: '16px' },
              { value: 'normal' as const, label: 'Normal', size: '18px' },
              { value: 'medium' as const, label: 'Large', size: '20px' },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFontSize(opt.value)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl text-sm font-medium  ${
                  fontSize === opt.value
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-600'
                }`}
              >
                <span style={{ fontSize: opt.size, fontFamily: "var(--font-reader)", lineHeight: '1.2' }}>Aa</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}
