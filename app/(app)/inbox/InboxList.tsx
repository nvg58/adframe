'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SearchBar from '@/components/ui/SearchBar'
import FilterChips from '@/components/ui/FilterChips'
import Badge from '@/components/ui/Badge'
import FAB from '@/components/ui/FAB'

interface InboxItem {
  id: string
  title: string
  source_url: string | null
  source_author: string | null
  tags: string[]
  status: string
  created_at: string
}

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
]

export default function InboxList({
  items,
  error,
  currentStatus,
  currentQuery,
}: {
  items: InboxItem[]
  error?: string
  currentStatus: string
  currentQuery: string
}) {
  const [search, setSearch] = useState(currentQuery)
  const [status, setStatus] = useState(currentStatus)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  // Track deleted IDs instead of copying items into state
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabaseRef = useRef(createClient())

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this article?')) return
    setDeletingId(id)
    try {
      const { error } = await supabaseRef.current
        .from('inbox_items')
        .delete()
        .eq('id', id)
      if (!error) {
        setDeletedIds((prev) => new Set(prev).add(id))
      } else {
        alert('Failed to delete')
      }
    } catch {
      alert('Failed to delete')
    }
    setDeletingId(null)
  }

  const handleStatusChange = (val: string) => {
    setStatus(val)
    const params = new URLSearchParams()
    if (val) params.set('status', val)
    if (search) params.set('q', search)
    router.push(`/inbox${params.toString() ? '?' + params.toString() : ''}`)
  }

  // Use items prop directly (stays in sync with server), minus deleted ones
  const filtered = useMemo(() => {
    let result = items.filter((item) => !deletedIds.has(item.id))
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.source_author?.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return result
  }, [items, search, deletedIds])

  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Inbox</h1>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search articles..."
      />

      {/* Filter chips */}
      <div className="mt-3 mb-4">
        <FilterChips
          options={statusOptions}
          selected={status}
          onChange={handleStatusChange}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm mb-4">
          Error loading inbox: {error}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && !error && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No articles yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Add content or use the Chrome Extension to clip from Skool.
          </p>
        </div>
      )}

      {/* Item list */}
      <div className="space-y-3 pb-4">
        {filtered.map((item) => (
          <Link
            key={item.id}
            href={`/inbox/${item.id}`}
            className={`block bg-white dark:bg-[#262626] rounded-xl border border-gray-100 dark:border-gray-700 p-4 active:bg-gray-50 dark:active:bg-gray-700 ${
              deletingId === item.id ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-snug line-clamp-2">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  {item.source_author && <span>{item.source_author}</span>}
                  {item.source_author && <span>·</span>}
                  <span>{item.created_at}</span>
                </div>
                {item.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {item.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="default">{tag}</Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-xs text-gray-400">+{item.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="shrink-0 flex items-start gap-2">
                <Badge variant="status" status={item.status}>
                  {item.status}
                </Badge>
                <button
                  onClick={(e) => handleDelete(e, item.id)}
                  className="p-1.5 -mr-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 active:text-red-600 transition-colors"
                  aria-label="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* FAB */}
      <FAB href="/inbox/new" />
    </div>
  )
}
