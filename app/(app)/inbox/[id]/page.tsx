import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate, splitHtmlIntoParagraphs, md5, stripHtml } from '@/lib/utils'
import { translateText } from '@/lib/translate'
import { markAsRead, deleteItem } from './actions'
import FontSizeControls from './FontSizeControls'
import AutoMarkRead from './AutoMarkRead'
import ReadingProgress from './ReadingProgress'
import TranslationMemory from './TranslationMemory'

export default async function InboxReaderPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { translate?: string; export?: string }
}) {
  const supabase = createClient()
  const { data: item, error } = await supabase
    .from('inbox_items')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !item) {
    notFound()
  }

  const paragraphs = splitHtmlIntoParagraphs(item.content)
  const wordCount = stripHtml(item.content).split(/\s+/).filter(Boolean).length
  const showTranslation = searchParams.translate === 'true'
  const showExport = searchParams.export === 'true'

  // Fetch translations server-side if requested
  const translationMap = new Map<number, string>()
  if (showTranslation) {
    const plainTexts = paragraphs.map(p => stripHtml(p)).filter(t => t.length > 10)
    const hashes = plainTexts.map(t => md5(t))

    const { data: cached } = await supabase
      .from('translations')
      .select('paragraph_hash, translated_text')
      .eq('inbox_item_id', item.id)
      .in('paragraph_hash', hashes)

    const cacheMap = new Map<string, string>()
    if (cached) {
      cached.forEach(c => cacheMap.set(c.paragraph_hash, c.translated_text))
    }

    let paraIndex = 0
    for (let i = 0; i < paragraphs.length; i++) {
      const plain = stripHtml(paragraphs[i])
      if (plain.length <= 10) continue

      const hash = hashes[paraIndex]
      let translated = cacheMap.get(hash)

      if (!translated) {
        try {
          // Send original HTML so translation preserves formatting
          translated = await translateText(paragraphs[i], 'html')
          await supabase.from('translations').upsert({
            inbox_item_id: item.id,
            paragraph_hash: hash,
            original_text: plain,
            translated_text: translated,
          }, { onConflict: 'inbox_item_id,paragraph_hash' })
        } catch {
          translated = '(Translation failed)'
        }
      }

      if (translated) {
        translationMap.set(i, translated)
      }
      paraIndex++
    }
  }

  // Export text
  let exportText = ''
  if (showExport) {
    const tags = (item.tags || []).join(', ')
    exportText = [
      `📚 ${item.title}`,
      `Nguồn: ${item.source_url || 'Skool'}`,
      `Tác giả: ${item.source_author || 'Unknown'}`,
      tags ? `Tags: ${tags}` : '',
      `Ngày lưu: ${formatDate(item.created_at)}`,
      '',
      '📖 NỘI DUNG:',
      stripHtml(item.content),
      '',
      '---',
    ].filter(Boolean).join('\n')
  }

  /* Icon button — 40px touch target, 20px icon */
  const iconBtn = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '40px', height: '40px',
    border: 'none', borderRadius: '8px',
    backgroundColor: 'transparent', color: '#6b7280',
    cursor: 'pointer', textDecoration: 'none',
    padding: 0,
  } as const

  const iconBtnActive = {
    ...iconBtn,
    backgroundColor: '#dbeafe', color: '#2563eb',
  } as const

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      {/* Remember translation state per item */}
      <TranslationMemory itemId={item.id} isOn={showTranslation} />
      {/* Header — single row, bigger buttons */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '0 6px', height: '48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Back */}
        <a href="/inbox" style={iconBtn} title="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </a>

        {/* Right-side actions */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {/* Font size controls */}
          <FontSizeControls />

          {/* Separator */}
          <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb', margin: '0 4px' }} />

          {/* Translate */}
          <a
            href={showTranslation
              ? `/inbox/${item.id}${showExport ? '?export=true' : ''}`
              : `/inbox/${item.id}?translate=true${showExport ? '&export=true' : ''}`}
            style={showTranslation ? iconBtnActive : iconBtn}
            title={showTranslation ? 'Hide Translation' : 'Translate'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 8l6 6" />
              <path d="M4 14l6-6 2-3" />
              <path d="M2 5h12" />
              <path d="M7 2h1" />
              <path d="M22 22l-5-10-5 10" />
              <path d="M14 18h6" />
            </svg>
          </a>

          {/* Export */}
          <a
            href={showExport
              ? `/inbox/${item.id}${showTranslation ? '?translate=true' : ''}`
              : `/inbox/${item.id}?export=true${showTranslation ? '&translate=true' : ''}`}
            style={showExport ? iconBtnActive : iconBtn}
            title="Export for Claude"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </a>

          {/* Mark as Read/Unread */}
          <form action={markAsRead} style={{ margin: 0 }}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="newStatus" value={item.status === 'read' ? 'unread' : 'read'} />
            <button
              type="submit"
              style={item.status === 'read' ? iconBtnActive : iconBtn}
              title={item.status === 'read' ? 'Mark as Unread' : 'Mark as Read'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {item.status === 'read' ? (
                  <>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12h8" />
                  </>
                )}
              </svg>
            </button>
          </form>

          {/* Delete */}
          <form action={deleteItem} style={{ margin: 0 }}>
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" style={{ ...iconBtn, color: '#ef4444' }} title="Delete">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </form>
        </div>
      </header>

      {/* Export panel */}
      {showExport && (
        <div style={{
          margin: '16px', padding: '16px',
          backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: '12px',
        }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '8px' }}>
            Export for Claude Project
          </p>
          <p style={{ fontSize: '12px', color: '#15803d', marginBottom: '12px' }}>
            Select all text below and copy it.
          </p>
          <textarea
            readOnly
            value={exportText}
            style={{
              width: '100%', minHeight: '200px', padding: '12px',
              fontSize: '12px', fontFamily: 'monospace',
              border: '1px solid #d1d5db', borderRadius: '8px',
              backgroundColor: '#fff', color: '#111',
              boxSizing: 'border-box',
            }}
          />
          <a
            href={`/inbox/${item.id}`}
            style={{
              display: 'block', textAlign: 'center', marginTop: '8px',
              padding: '8px', color: '#6b7280', fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            Close
          </a>
        </div>
      )}

      {/* Article */}
      <article style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 20px 48px' }}>
        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <p style={{
            fontSize: '11px', fontWeight: 500, color: '#9ca3af',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            textAlign: 'center', marginBottom: '16px',
          }}>
            {item.tags[0]}
          </p>
        )}

        {/* Title */}
        <h1 style={{
          fontSize: '24px', fontWeight: 'bold', color: '#111',
          textAlign: 'center', marginBottom: '12px', lineHeight: '1.35',
        }}>
          {item.title}
        </h1>

        {/* Author + date */}
        <p style={{
          textAlign: 'center', color: '#9ca3af', fontSize: '14px',
          marginBottom: '24px',
        }}>
          {item.source_author && <>{item.source_author} · </>}
          {formatDate(item.created_at)}
        </p>

        {/* Divider */}
        <div style={{
          width: '48px', height: '1px', backgroundColor: '#e5e7eb',
          margin: '0 auto 32px',
        }} />

        {/* Article body — font size controlled via CSS variable from FontSizeControls */}
        <div className="reader-content" style={{ fontSize: 'var(--reader-font-size, 16px)', lineHeight: 1.8 }}>
          {paragraphs.map((para, i) => {
            const isTable = /^<table/i.test(para.trim())
            return (
            <div key={i}>
              <div
                dangerouslySetInnerHTML={{ __html: para }}
                style={{
                  marginBottom: '4px',
                  ...(isTable ? { overflowX: 'auto', WebkitOverflowScrolling: 'touch' } : {}),
                }}
              />
              {showTranslation && translationMap.has(i) && (
                <div
                  dangerouslySetInnerHTML={{ __html: translationMap.get(i)! }}
                  style={{
                    marginTop: '4px', marginBottom: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#fffde7', borderLeft: '4px solid #fcd34d',
                    borderRadius: '0 8px 8px 0',
                    color: '#555', fontStyle: 'italic', fontSize: '0.9em', lineHeight: '1.7',
                    overflowX: 'auto', WebkitOverflowScrolling: 'touch',
                  }}>
                </div>
              )}
            </div>
          )})}
        </div>

        {/* Auto mark as read when user scrolls to end */}
        {item.status === 'unread' && (
          <AutoMarkRead itemId={item.id} />
        )}
      </article>

      {/* Kindle-style reading progress */}
      <ReadingProgress wordCount={wordCount} itemId={item.id} initialProgress={item.reading_progress || 0} />
    </div>
  )
}
