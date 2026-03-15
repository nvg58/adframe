'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

interface SwipeItem {
  id: string
  title: string | null
  ad_type: string
  content_text: string | null
  content_url: string | null
  image_url: string | null
  image_path: string | null
  platform: string
  category: string
  tags: string[]
  notes: string | null
  created_at: string
}

function extractYoutubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  return match?.[1] || ''
}

export default function SwipeDetail({ item }: { item: SwipeItem }) {
  const [notes, setNotes] = useState(item.notes || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSaveNotes = async () => {
    setSaving(true)
    await supabase
      .from('swipe_items')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', item.id)
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this ad?')) return
    setDeleting(true)
    await supabase.from('swipe_items').delete().eq('id', item.id)
    router.push('/swipe')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 h-12">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 -ml-2 text-gray-700 dark:text-gray-300"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-500 font-medium disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Ad content */}
      <div className="max-w-2xl mx-auto">
        {/* Visual preview */}
        {item.ad_type === 'image' && item.image_url && (
          <img
            src={item.image_url}
            alt={item.title || 'Ad'}
            className="w-full"
          />
        )}

        {item.ad_type === 'video' && item.content_url && (
          <div className="p-4">
            {item.content_url.includes('youtube.com') || item.content_url.includes('youtu.be') ? (
              <iframe
                src={`https://www.youtube.com/embed/${extractYoutubeId(item.content_url)}`}
                className="w-full aspect-video rounded-xl"
                allowFullScreen
              />
            ) : (
              <a
                href={item.content_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-blue-600"
              >
                🎬 Open Video
              </a>
            )}
          </div>
        )}

        {item.ad_type === 'text' && item.content_text && (
          <div className="p-5">
            <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                {item.content_text}
              </p>
            </div>
          </div>
        )}

        {item.ad_type === 'url' && item.content_url && (
          <div className="p-5">
            <a
              href={item.content_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl text-sm"
            >
              🔗 {item.content_url}
            </a>
          </div>
        )}

        {/* Metadata */}
        <div className="px-5 py-4 space-y-4">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {item.title || 'Untitled'}
          </h1>

          <div className="flex gap-2 flex-wrap">
            <Badge variant="platform" platform={item.platform}>{item.platform}</Badge>
            <Badge variant="category" category={item.category}>{item.category}</Badge>
          </div>

          {item.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {item.tags.map((tag: string) => (
                <Badge key={tag} variant="default">{tag}</Badge>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400">{formatDate(item.created_at)}</p>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Notes {saving && <span className="text-xs text-gray-400">(saving...)</span>}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              rows={5}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
              placeholder="Write down what you learned from this ad — hook structure, CTA, offer framing..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
