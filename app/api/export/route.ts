import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { formatDate, stripHtml } from '@/lib/utils'

export async function GET(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const itemId = searchParams.get('inbox_item_id')

  if (!itemId) {
    return NextResponse.json(
      { error: 'Missing inbox_item_id' },
      { status: 400 }
    )
  }

  const { data: item, error } = await supabase
    .from('inbox_items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (error || !item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  const plainContent = stripHtml(item.content).trim()

  const formatted_text = `📚 ${item.title}
Source: ${item.source_url || 'Skool'}
Author: ${item.source_author || 'Unknown'}
Tags: ${item.tags.length > 0 ? item.tags.join(', ') : 'None'}
Saved: ${formatDate(item.created_at)}

📖 CONTENT:
${plainContent}

---`

  return NextResponse.json({ formatted_text })
}
