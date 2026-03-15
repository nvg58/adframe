import { createClient } from '@/lib/supabase/server'
import { translateText } from '@/lib/translate'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { inbox_item_id, text, paragraph_hash } = await request.json()

  if (!inbox_item_id || !text || !paragraph_hash) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  // Check cache
  const { data: cached } = await supabase
    .from('translations')
    .select('translated_text')
    .eq('inbox_item_id', inbox_item_id)
    .eq('paragraph_hash', paragraph_hash)
    .single()

  if (cached) {
    return NextResponse.json({
      translated_text: cached.translated_text,
      cached: true,
    })
  }

  // Translate
  try {
    const translated_text = await translateText(text)

    // Cache the translation
    await supabase.from('translations').upsert(
      {
        inbox_item_id,
        paragraph_hash,
        original_text: text,
        translated_text,
      },
      { onConflict: 'inbox_item_id,paragraph_hash' }
    )

    return NextResponse.json({ translated_text, cached: false })
  } catch {
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    )
  }
}
