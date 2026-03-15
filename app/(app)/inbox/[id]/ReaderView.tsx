'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { splitHtmlIntoParagraphs, md5 } from '@/lib/utils'
import ReaderHeader from '@/components/reader/ReaderHeader'
import DisplaySettings from '@/components/reader/DisplaySettings'
import TranslateOverlay from '@/components/reader/TranslateOverlay'

interface ItemData {
  id: string
  title: string
  content: string
  source_author: string | null
  source_url: string | null
  tags: string[]
  status: string
  created_at: string
}

interface TranslationResult {
  original: string
  translated: string
}

export default function ReaderView({ item }: { item: ItemData }) {
  const [showDisplaySettings, setShowDisplaySettings] = useState(false)
  const [showTranslateSheet, setShowTranslateSheet] = useState(false)
  const [translations, setTranslations] = useState<TranslationResult[]>([])
  const [showTranslation, setShowTranslation] = useState(false)
  const [statusText, setStatusText] = useState(item.status)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const paragraphs = splitHtmlIntoParagraphs(item.content)

  const handleMarkAsRead = async () => {
    try {
      const res = await fetch(`/api/inbox/${item.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusText === 'read' ? 'unread' : 'read' }),
      })
      if (res.ok) {
        setStatusText(statusText === 'read' ? 'unread' : 'read')
      }
    } catch {
      // Failed silently
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/export?inbox_item_id=${item.id}`)
      const data = await res.json()
      await navigator.clipboard.writeText(data.formatted_text)
      alert('Copied to clipboard!')
    } catch {
      alert('Failed to copy')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this article? This cannot be undone.')) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('inbox_items')
        .delete()
        .eq('id', item.id)
      if (!error) {
        router.push('/inbox')
      } else {
        alert('Failed to delete')
        setDeleting(false)
      }
    } catch {
      alert('Failed to delete')
      setDeleting(false)
    }
  }

  const handleTranslated = useCallback((results: TranslationResult[]) => {
    setTranslations(results)
    setShowTranslation(true)
  }, [])

  const handleTranslateClick = () => {
    if (translations.length > 0) {
      setShowTranslation(!showTranslation)
    } else {
      setShowTranslateSheet(true)
    }
  }

  const headerActions = [
    {
      label: showTranslation ? 'Hide Translation' : 'Translate',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 8l6 6" />
          <path d="M4 14l6-6 2-3" />
          <path d="M2 5h12" />
          <path d="M7 2h1" />
          <path d="M22 22l-5-10-5 10" />
          <path d="M14 18h6" />
        </svg>
      ),
      onClick: handleTranslateClick,
      active: showTranslation,
    },
  ]

  const menuItems = [
    {
      label: 'Display Settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ),
      onClick: () => setShowDisplaySettings(true),
    },
    {
      label: 'Export for Claude',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
      onClick: handleExport,
    },
    {
      label: statusText === 'read' ? 'Mark as Unread' : 'Mark as Read',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {statusText === 'read' ? (
            <><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></>
          ) : (
            <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
          )}
        </svg>
      ),
      onClick: handleMarkAsRead,
    },
    {
      label: deleting ? 'Deleting...' : 'Delete',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      ),
      onClick: handleDelete,
      destructive: true,
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      <ReaderHeader menuItems={menuItems} actions={headerActions} />

      {/* Article header */}
      <div className="max-w-2xl mx-auto px-5 pt-8 pb-4">
        {/* Section label */}
        {item.tags.length > 0 && (
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center mb-4">
            {item.tags[0]}
          </p>
        )}

        {/* Title */}
        <h1
          className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-3"
          style={{
            fontFamily: "var(--font-reader)",
            lineHeight: '1.35',
          }}
        >
          {item.title}
        </h1>

        {/* Author + date */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-6">
          {item.source_author && (
            <>
              <span>{item.source_author}</span>
              <span>·</span>
            </>
          )}
          <span>{item.created_at}</span>
        </div>

        {/* Divider */}
        <div className="w-12 h-px bg-gray-200 dark:bg-gray-700 mx-auto mb-8" />
      </div>

      {/* Article body */}
      <div className="max-w-2xl mx-auto px-5 pb-20">
        <InteractiveContent
          paragraphs={paragraphs}
          itemId={item.id}
          bulkTranslations={showTranslation ? translations : []}
        />
      </div>

      {/* Bottom sheets */}
      <DisplaySettings
        open={showDisplaySettings}
        onClose={() => setShowDisplaySettings(false)}
      />
      <TranslateOverlay
        paragraphs={paragraphs}
        itemId={item.id}
        open={showTranslateSheet}
        onClose={() => setShowTranslateSheet(false)}
        onTranslated={handleTranslated}
      />
    </div>
  )
}

// Helper to get plain text from HTML
function getPlainText(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

// Interactive content: tap any paragraph to translate it individually
function InteractiveContent({
  paragraphs,
  itemId,
  bulkTranslations,
}: {
  paragraphs: string[]
  itemId: string
  bulkTranslations: TranslationResult[]
}) {
  // Build bulk translation map
  const bulkMap = new Map<string, string>()
  bulkTranslations.forEach((t) => {
    if (t.translated) {
      bulkMap.set(t.original.slice(0, 60), t.translated)
    }
  })

  return (
    <div className="reader-content">
      {paragraphs.map((para, i) => {
        const plain = getPlainText(para)
        const bulkTranslated = bulkMap.get(plain.slice(0, 60))

        return (
          <TappableParagraph
            key={i}
            html={para}
            plainText={plain}
            itemId={itemId}
            bulkTranslation={bulkTranslated}
          />
        )
      })}
    </div>
  )
}

// Single paragraph with tap-to-translate
function TappableParagraph({
  html,
  plainText,
  itemId,
  bulkTranslation,
}: {
  html: string
  plainText: string
  itemId: string
  bulkTranslation?: string
}) {
  const [translation, setTranslation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)

  // Use bulk translation if available
  const displayText = bulkTranslation || translation

  const handleTap = async () => {
    // If already have translation, toggle visibility
    if (displayText) {
      setVisible(!visible)
      return
    }

    // Skip very short paragraphs
    if (plainText.length <= 10) return

    setLoading(true)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inbox_item_id: itemId,
          text: plainText,
          paragraph_hash: md5(plainText),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setTranslation(data.translated_text || '')
        setVisible(true)
      }
    } catch {
      // Silent fail
    }
    setLoading(false)
  }

  // Auto-show bulk translations
  const showTranslation = bulkTranslation ? true : visible

  return (
    <div className="mb-1">
      {/* Paragraph - tappable */}
      <div
        onClick={handleTap}
        className="cursor-pointer active:bg-gray-50 dark:active:bg-gray-800/50 rounded -mx-2 px-2 py-0.5"
      >
        <div dangerouslySetInnerHTML={{ __html: html }} />
        {loading && (
          <span className="text-xs text-gray-400 dark:text-gray-500 italic">
            Translating...
          </span>
        )}
      </div>

      {/* Translation block */}
      {showTranslation && displayText && (
        <div
          onClick={() => { if (!bulkTranslation) setVisible(false) }}
          className="mt-1 py-2 px-3 bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-300 dark:border-amber-600 text-gray-600 dark:text-gray-300 italic text-sm rounded-r-lg cursor-pointer"
          style={{ fontFamily: "var(--font-reader)", lineHeight: '1.7' }}
        >
          {displayText}
        </div>
      )}
    </div>
  )
}
