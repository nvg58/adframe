'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SearchBar from '@/components/ui/SearchBar'
import FilterChips from '@/components/ui/FilterChips'
import Badge from '@/components/ui/Badge'
import FAB from '@/components/ui/FAB'

interface SwipeItem {
  id: string
  title: string | null
  ad_type: string
  content_text: string | null
  content_url: string | null
  image_url?: string | null
  platform: string
  category: string
  tags: string[]
}

const platformOptions = [
  { value: '', label: 'All' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'google', label: 'Google' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'other', label: 'Other' },
]

export default function SwipeList({
  items,
  error,
  currentPlatform,
  currentCategory,
}: {
  items: SwipeItem[]
  error?: string
  currentPlatform: string
  currentCategory: string
}) {
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState(currentPlatform)
  const router = useRouter()

  const handlePlatformChange = (val: string) => {
    setPlatform(val)
    const params = new URLSearchParams()
    if (val) params.set('platform', val)
    if (currentCategory) params.set('category', currentCategory)
    router.push(`/swipe${params.toString() ? '?' + params.toString() : ''}`)
  }

  const filtered = useMemo(() => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.content_text?.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
    )
  }, [items, search])

  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Swipe File</h1>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search ads..."
      />

      <div className="mt-3 mb-4">
        <FilterChips
          options={platformOptions}
          selected={platform}
          onChange={handlePlatformChange}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm mb-4">
          Error: {error}
        </div>
      )}

      {filtered.length === 0 && !error && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🗂️</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Swipe file is empty</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Add a new ad to start building your swipe file.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-4">
        {filtered.map((item) => (
          <Link
            key={item.id}
            href={`/swipe/${item.id}`}
            className="block bg-white dark:bg-[#262626] rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden active:scale-[0.98] transition-transform"
          >
            {/* Preview area */}
            <div className="aspect-square bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
              {item.ad_type === 'image' && item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title || 'Ad'}
                  className="w-full h-full object-cover"
                />
              ) : item.ad_type === 'video' ? (
                <div className="text-center">
                  <span className="text-3xl">🎬</span>
                  <p className="text-xs text-gray-400 mt-1">Video</p>
                </div>
              ) : item.ad_type === 'text' ? (
                <p className="px-3 py-2 text-xs text-gray-500 line-clamp-5 leading-relaxed">
                  {item.content_text}
                </p>
              ) : (
                <div className="text-center">
                  <span className="text-3xl">🔗</span>
                  <p className="text-xs text-gray-400 mt-1">Link</p>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-2.5">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 text-xs truncate">
                {item.title || 'Untitled'}
              </h3>
              <div className="flex gap-1 mt-1.5">
                <Badge variant="platform" platform={item.platform}>{item.platform}</Badge>
                <Badge variant="category" category={item.category}>{item.category}</Badge>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <FAB href="/swipe/new" />
    </div>
  )
}
