'use client'

import { useState, useCallback, useEffect, memo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { splitHtmlIntoParagraphs, md5 } from '@/lib/utils'
import ReaderHeader from '@/components/reader/ReaderHeader'
import DisplaySettings from '@/components/reader/DisplaySettings'
import TranslateOverlay from '@/components/reader/TranslateOverlay'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

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

// Debug log helper — shows on screen for einkbro (no devtools)
const debugLog: string[] = []
function dbg(msg: string) {
  const ts = new Date().toLocaleTimeString()
  debugLog.push(`[${ts}] ${msg}`)
  if (debugLog.length > 20) debugLog.shift()
  // Force re-render via DOM (React state won't help if React is broken)
  try {
    const el = document.getElementById('adframe-debug')
    if (el) {
      el.textContent = debugLog.join('\n')
    }
  } catch {}
}

export default function ReaderView({ item }: { item: ItemData }) {
  const [showDisplaySettings, setShowDisplaySettings] = useState(false)
  const [showTranslateSheet, setShowTranslateSheet] = useState(false)
  const [translations, setTranslations] = useState<TranslationResult[]>([])
  const [showTranslation, setShowTranslation] = useState(false)
  const [statusText, setStatusText] = useState(item.status)
  const [deleting, setDeleting] = useState(false)
  const [jsErrors, setJsErrors] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  // Log mount
  useEffect(() => {
    dbg(`ReaderView mounted. paragraphs=${splitHtmlIntoParagraphs(item.content).length}, UA=${navigator.userAgent?.slice(0, 80)}`)
  }, [])

  // Catch unhandled JS errors and show them on screen (for einkbro debugging)
  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      dbg(`ERROR: ${e.message} at ${e.filename}:${e.lineno}`)
      if (e.message?.includes('Loading chunk') || e.message?.includes('ChunkLoadError')) {
        try { window.location.reload() } catch {}
        return
      }
      setJsErrors(prev => [...prev.slice(-4), `${e.message} at ${e.filename}:${e.lineno}`])
    }
    const rejectionHandler = (e: PromiseRejectionEvent) => {
      const msg = e.reason?.message || e.reason?.toString() || 'Unhandled promise rejection'
      dbg(`REJECTION: ${msg}`)
      if (msg?.includes('Loading chunk') || msg?.includes('ChunkLoadError')) {
        try { window.location.reload() } catch {}
        return
      }
      setJsErrors(prev => [...prev.slice(-4), msg])
    }
    window.addEventListener('error', handler)
    window.addEventListener('unhandledrejection', rejectionHandler)
    return () => {
      window.removeEventListener('error', handler)
      window.removeEventListener('unhandledrejection', rejectionHandler)
    }
  }, [])

  const paragraphs = splitHtmlIntoParagraphs(item.content)

  const handleMarkAsRead = async () => {
    dbg('handleMarkAsRead called')
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

  const [exportStatus, setExportStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const handleExport = async () => {
    dbg('handleExport called')
    try {
      const res = await fetch(`/api/export?inbox_item_id=${item.id}`)
      const data = await res.json()
      // Clipboard API with fallback for older browsers
      try {
        await navigator.clipboard.writeText(data.formatted_text)
      } catch {
        const textarea = document.createElement('textarea')
        textarea.value = data.formatted_text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setExportStatus('copied')
      setTimeout(() => setExportStatus('idle'), 2000)
    } catch {
      setExportStatus('failed')
      setTimeout(() => setExportStatus('idle'), 2000)
    }
  }

  const handleDelete = async () => {
    dbg('handleDelete called, confirmingDelete=' + confirmingDelete)
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    setDeleting(true)
    setConfirmingDelete(false)
    try {
      const { error } = await supabase
        .from('inbox_items')
        .delete()
        .eq('id', item.id)
      if (!error) {
        router.push('/inbox')
      } else {
        setDeleting(false)
      }
    } catch {
      setDeleting(false)
    }
  }

  const handleTranslated = useCallback((results: TranslationResult[]) => {
    setTranslations(results)
    setShowTranslation(true)
  }, [])

  const handleTranslateClick = () => {
    dbg('handleTranslateClick called, translations.length=' + translations.length)
    if (translations.length > 0) {
      setShowTranslation(!showTranslation)
    } else {
      setShowTranslateSheet(true)
      dbg('setShowTranslateSheet(true)')
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
      onClick: () => { dbg('Display Settings clicked'); setShowDisplaySettings(true) },
    },
    {
      label: exportStatus === 'copied' ? 'Copied!' : exportStatus === 'failed' ? 'Copy failed' : 'Export for Claude',
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
      label: deleting ? 'Deleting...' : confirmingDelete ? 'Tap again to confirm' : 'Delete',
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
      {/* On-screen error log for debugging on einkbro */}
      {jsErrors.length > 0 && (
        <div style={{
          position: 'relative', zIndex: 9999, padding: '8px 12px',
          backgroundColor: '#fee', borderBottom: '2px solid #f88',
          fontSize: '11px', fontFamily: 'monospace', lineHeight: '1.4',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>JS Errors ({jsErrors.length}):</div>
          {jsErrors.map((err, i) => (
            <div key={i} style={{ color: '#c00', wordBreak: 'break-all' }}>{err}</div>
          ))}
          <button
            onClick={() => setJsErrors([])}
            style={{ marginTop: '4px', padding: '2px 8px', fontSize: '11px', border: '1px solid #f88', borderRadius: '4px', cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>
      )}

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
        <ErrorBoundary fallbackMessage="Failed to render article content">
          <InteractiveContent
            paragraphs={paragraphs}
            itemId={item.id}
            bulkTranslations={showTranslation ? translations : []}
          />
        </ErrorBoundary>
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

      {/* Debug panel — visible on einkbro for troubleshooting */}
      <div style={{
        position: 'relative', margin: '20px 10px', padding: '10px',
        backgroundColor: '#f0f0f0', border: '1px solid #ccc',
        borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace',
        lineHeight: '1.4', wordBreak: 'break-all',
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          Debug Log | showDisplaySettings={String(showDisplaySettings)} | showTranslateSheet={String(showTranslateSheet)}
        </div>
        <pre id="adframe-debug" style={{ margin: 0, whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto' }}>
          {debugLog.join('\n') || '(no logs yet)'}
        </pre>
      </div>
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

// Single paragraph with tap-to-translate (memoized to prevent re-renders)
const TappableParagraph = memo(function TappableParagraph({
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
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inbox_item_id: itemId,
          text: plainText,
          paragraph_hash: md5(plainText),
        }),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (res.ok) {
        const data = await res.json()
        setTranslation(data.translated_text || '')
        setVisible(true)
      }
    } catch {
      // Silent fail (includes timeout abort)
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
})
