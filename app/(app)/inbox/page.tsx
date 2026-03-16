import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { deleteInboxItem } from './actions'
import ItemProgress from './ItemProgress'

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; tag?: string }
}) {
  const supabase = createClient()
  let query = supabase
    .from('inbox_items')
    .select('*')
    .order('created_at', { ascending: false })

  const currentStatus = searchParams.status || ''
  const currentQuery = searchParams.q || ''

  if (currentStatus) {
    query = query.eq('status', currentStatus)
  }
  if (searchParams.tag) {
    query = query.contains('tags', [searchParams.tag])
  }

  const { data: items, error } = await query

  // Server-side format + search filter
  let filtered = (items || []).map((item) => ({
    id: item.id,
    title: item.title,
    source_url: item.source_url,
    source_author: item.source_author,
    tags: (item.tags || []) as string[],
    status: item.status as string,
    created_at: formatDate(item.created_at),
  }))

  if (currentQuery) {
    const q = currentQuery.toLowerCase()
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.source_author?.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
    )
  }

  // Build filter URLs
  const filterUrl = (status: string) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (currentQuery) params.set('q', currentQuery)
    const qs = params.toString()
    return `/inbox${qs ? '?' + qs : ''}`
  }

  const statusFilters = [
    { value: '', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
  ]

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <h1 style={{
        fontSize: '20px', fontWeight: 'bold', color: '#111',
        marginBottom: '16px',
      }}>
        Inbox
      </h1>

      {/* Search — plain HTML form, works without JS */}
      <form method="get" action="/inbox" style={{ marginBottom: '12px' }}>
        {currentStatus && <input type="hidden" name="status" value={currentStatus} />}
        <div style={{ position: 'relative' }}>
          <svg
            style={{
              position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
              color: '#9ca3af',
            }}
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            name="q"
            defaultValue={currentQuery}
            placeholder="Search articles..."
            style={{
              width: '100%', paddingLeft: '40px', paddingRight: '16px',
              paddingTop: '12px', paddingBottom: '12px',
              backgroundColor: '#f3f4f6', color: '#111',
              borderRadius: '12px', border: 'none', fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </form>

      {/* Filter chips — plain <a> links */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
        {statusFilters.map((f) => (
          <a
            key={f.value}
            href={filterUrl(f.value)}
            style={{
              flexShrink: 0,
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '14px', fontWeight: 500,
              textDecoration: 'none',
              backgroundColor: currentStatus === f.value ? '#111' : '#f3f4f6',
              color: currentStatus === f.value ? '#fff' : '#4b5563',
            }}
          >
            {f.label}
          </a>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px', backgroundColor: '#fef2f2',
          color: '#b91c1c', borderRadius: '12px', fontSize: '14px',
          marginBottom: '16px',
        }}>
          Error loading inbox: {error.message}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📚</div>
          <p style={{ color: '#6b7280', fontWeight: 500, margin: 0 }}>No articles yet</p>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>
            Add content or use the Chrome Extension to clip from Skool.
          </p>
        </div>
      )}

      {/* Item list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>
        {filtered.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: '#fff', borderRadius: '12px',
              border: '1px solid #f3f4f6', padding: '16px',
              position: 'relative',
            }}
          >
            <a
              href={`/inbox/${item.id}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontWeight: 500, color: '#111', fontSize: '14px',
                    lineHeight: '1.4', margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {item.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '12px', color: '#9ca3af' }}>
                    {item.source_author && <span>{item.source_author}</span>}
                    {item.source_author && <span>&middot;</span>}
                    <span>{item.created_at}</span>
                  </div>
                  <ItemProgress itemId={item.id} />
                  {item.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} style={{
                          display: 'inline-flex', padding: '2px 10px',
                          borderRadius: '9999px', fontSize: '12px', fontWeight: 500,
                          backgroundColor: '#f3f4f6', color: '#4b5563',
                        }}>
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>+{item.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                <span style={{
                  flexShrink: 0,
                  display: 'inline-flex', padding: '2px 10px',
                  borderRadius: '9999px', fontSize: '12px', fontWeight: 500,
                  backgroundColor: item.status === 'unread' ? '#eff6ff' : '#f3f4f6',
                  color: item.status === 'unread' ? '#1d4ed8' : '#4b5563',
                }}>
                  {item.status}
                </span>
              </div>
            </a>
            {/* Delete — server action, no JS needed */}
            <form action={deleteInboxItem} style={{
              position: 'absolute', top: '40px', right: '12px',
              margin: 0,
            }}>
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px', color: '#d1d5db',
                }}
                title="Delete"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </form>
          </div>
        ))}
      </div>

      {/* FAB */}
      <a
        href="/inbox/new"
        style={{
          position: 'fixed', right: '16px', bottom: '80px', zIndex: 40,
          width: '56px', height: '56px',
          backgroundColor: '#2563eb', color: '#fff',
          borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          textDecoration: 'none',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </a>
    </div>
  )
}
