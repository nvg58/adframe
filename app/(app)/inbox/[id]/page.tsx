import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import ReaderView from './ReaderView'

export default async function InboxReaderPage({
  params,
}: {
  params: { id: string }
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

  return (
    <ReaderView
      item={{
        id: item.id,
        title: item.title,
        content: item.content,
        source_author: item.source_author,
        source_url: item.source_url,
        tags: item.tags || [],
        status: item.status,
        created_at: formatDate(item.created_at),
      }}
    />
  )
}
