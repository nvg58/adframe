import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import InboxList from './InboxList'

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { status?: string; tag?: string; q?: string }
}) {
  const supabase = createClient()
  let query = supabase
    .from('inbox_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }
  if (searchParams.tag) {
    query = query.contains('tags', [searchParams.tag])
  }

  const { data: items, error } = await query

  const formattedItems = (items || []).map((item) => ({
    id: item.id,
    title: item.title,
    source_url: item.source_url,
    source_author: item.source_author,
    tags: item.tags || [],
    status: item.status,
    created_at: formatDate(item.created_at),
  }))

  return (
    <InboxList
      items={formattedItems}
      error={error?.message}
      currentStatus={searchParams.status || ''}
      currentQuery={searchParams.q || ''}
    />
  )
}
