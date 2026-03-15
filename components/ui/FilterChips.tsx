'use client'

export default function FilterChips({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[]
  selected: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selected === opt.value
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
