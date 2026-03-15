import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2'

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { inbox_item_id, paragraphs } = await request.json()
  // paragraphs: Array<{ text: string, paragraph_hash: string }>

  if (!inbox_item_id || !paragraphs || !Array.isArray(paragraphs) || paragraphs.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // 1. Check cache for all paragraphs at once
    const hashes = paragraphs.map((p: { paragraph_hash: string }) => p.paragraph_hash)
    const { data: cached } = await supabase
      .from('translations')
      .select('paragraph_hash, translated_text')
      .eq('inbox_item_id', inbox_item_id)
      .in('paragraph_hash', hashes)

    const cacheMap = new Map<string, string>()
    if (cached) {
      cached.forEach((c) => cacheMap.set(c.paragraph_hash, c.translated_text))
    }

    // 2. Find uncached paragraphs
    const uncached = paragraphs.filter(
      (p: { paragraph_hash: string }) => !cacheMap.has(p.paragraph_hash)
    )

    // 3. Batch translate uncached paragraphs via Google Translate
    if (uncached.length > 0) {
      const textsToTranslate = uncached.map((p: { text: string }) => p.text)

      // Google Translate API supports multiple q parameters
      const response = await fetch(
        `${GOOGLE_TRANSLATE_URL}?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: textsToTranslate,
            source: 'en',
            target: 'vi',
            format: 'text',
          }),
        }
      )

      if (!response.ok) {
        const errText = await response.text()
        console.error('Google Translate API error:', response.status, errText)
        return NextResponse.json({ error: 'Translation API failed' }, { status: 502 })
      }

      const data = await response.json()
      const translations = data.data.translations

      // 4. Cache all new translations in one batch
      const toInsert = uncached.map((p: { text: string; paragraph_hash: string }, i: number) => ({
        inbox_item_id,
        paragraph_hash: p.paragraph_hash,
        original_text: p.text,
        translated_text: translations[i].translatedText,
      }))

      await supabase
        .from('translations')
        .upsert(toInsert, { onConflict: 'inbox_item_id,paragraph_hash' })

      // Add to cache map
      uncached.forEach((p: { paragraph_hash: string }, i: number) => {
        cacheMap.set(p.paragraph_hash, translations[i].translatedText)
      })
    }

    // 5. Return all translations in original order
    const results = paragraphs.map((p: { text: string; paragraph_hash: string }) => ({
      original: p.text,
      translated: cacheMap.get(p.paragraph_hash) || '',
    }))

    return NextResponse.json({ translations: results })
  } catch (err) {
    console.error('Batch translate error:', err)
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
  }
}
