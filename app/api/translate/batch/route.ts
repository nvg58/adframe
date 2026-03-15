import { createClient } from '@/lib/supabase/server'
import { translateText } from '@/lib/translate'
import { NextResponse } from 'next/server'

// Allow longer execution on Vercel
export const maxDuration = 30

// Concurrency limit to avoid rate limiting
const CONCURRENCY = 5

async function translateWithConcurrency(
  texts: string[],
  concurrency: number
): Promise<string[]> {
  const results: string[] = new Array(texts.length)

  for (let i = 0; i < texts.length; i += concurrency) {
    const batch = texts.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map((text) => translateText(text))
    )
    batchResults.forEach((result, j) => {
      results[i + j] = result
    })
  }

  return results
}

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { inbox_item_id, paragraphs } = await request.json()

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

    // 3. Translate uncached paragraphs (5 at a time in parallel)
    if (uncached.length > 0) {
      const textsToTranslate = uncached.map((p: { text: string }) => p.text)
      const translated = await translateWithConcurrency(textsToTranslate, CONCURRENCY)

      // 4. Cache all new translations in one batch
      const toInsert = uncached.map((p: { text: string; paragraph_hash: string }, i: number) => ({
        inbox_item_id,
        paragraph_hash: p.paragraph_hash,
        original_text: p.text,
        translated_text: translated[i],
      }))

      await supabase
        .from('translations')
        .upsert(toInsert, { onConflict: 'inbox_item_id,paragraph_hash' })

      // Add to cache map
      uncached.forEach((p: { paragraph_hash: string }, i: number) => {
        cacheMap.set(p.paragraph_hash, translated[i])
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
    const message = err instanceof Error ? err.message : 'Translation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
