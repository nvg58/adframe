const statusColors: Record<string, string> = {
  unread: 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  read: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  planned: 'bg-yellow-50 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  launched: 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  done: 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300',
}

const platformColors: Record<string, string> = {
  facebook: 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  tiktok: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
  google: 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  instagram: 'bg-pink-50 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
  youtube: 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  other: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
}

const categoryColors: Record<string, string> = {
  hook: 'bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  cta: 'bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  visual: 'bg-cyan-50 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
  offer: 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  other: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
}

type BadgeVariant = 'default' | 'status' | 'platform' | 'category'

export default function Badge({
  children,
  variant = 'default',
  value,
  status,
  platform,
  category,
}: {
  children: React.ReactNode
  variant?: BadgeVariant
  value?: string
  status?: string
  platform?: string
  category?: string
}) {
  let colorClass = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
  const resolvedValue = value || status || platform || category

  if (variant === 'status' && resolvedValue) {
    colorClass = statusColors[resolvedValue] || colorClass
  } else if (variant === 'platform' && resolvedValue) {
    colorClass = platformColors[resolvedValue] || colorClass
  } else if (variant === 'category' && resolvedValue) {
    colorClass = categoryColors[resolvedValue] || colorClass
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {children}
    </span>
  )
}
