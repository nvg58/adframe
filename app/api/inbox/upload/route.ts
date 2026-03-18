import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseUploadedFile } from '@/lib/parse-file'

const MAX_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_EXTENSIONS = ['epub', 'docx', 'txt']

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'File too large (max 20MB)' },
      { status: 400 }
    )
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `Unsupported file type. Supported: ${ALLOWED_EXTENSIONS.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const result = await parseUploadedFile(buffer, file.name)

    if (result.items.length === 0) {
      return NextResponse.json(
        { error: 'No content could be extracted from this file.' },
        { status: 400 }
      )
    }

    // Insert all items
    const rows = result.items.map((item) => ({
      user_id: user.id,
      title: item.title,
      content: item.content,
      source_author: item.source_author || null,
      tags: item.tags,
      status: 'unread' as const,
    }))

    const { data, error } = await supabase
      .from('inbox_items')
      .insert(rows)
      .select('id, title')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      items: data,
      success: true,
      message: `Added ${data.length} item${data.length > 1 ? 's' : ''} to inbox`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to parse file'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
