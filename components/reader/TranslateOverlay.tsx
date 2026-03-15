'use client'

import { useState, useCallback } from 'react'
import { md5 } from '@/lib/utils'
import BottomSheet from '@/components/ui/BottomSheet'

function getPlainText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

interface TranslationResult {
  original: string
  translated: string
}

export default function TranslateOverlay({
  paragraphs,
  itemId,
  open,
  onClose,
  onTranslated,
}: {
  paragraphs: string[]
  itemId: string
  open: boolean
  onClose: () => void
  onTranslated: (translations: TranslationResult[]) => void
}) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')

  const handleTranslateAll = useCallback(async () => {
    setLoading(true)
    setError('')

    const textsToTranslate = paragraphs
      .map((p) => getPlainText(p))
      .filter((t) => t.length > 10)

    setTotal(textsToTranslate.length)
    setProgress(0)

    try {
      const batchPayload = textsToTranslate.map((text) => ({
        text,
        paragraph_hash: md5(text),
      }))

      const res = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inbox_item_id: itemId,
          paragraphs: batchPayload,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Batch translate error:', res.status, errData)
        setError(errData.error || 'Translation failed. Please try again.')
        setLoading(false)
        return
      }

      const data = await res.json()
      setProgress(textsToTranslate.length)
      onTranslated(data.translations)
      setLoading(false)
      onClose()
    } catch (err) {
      console.error('Translate fetch error:', err)
      setError('Translation failed. Please check your connection and try again.')
      setLoading(false)
    }
  }, [paragraphs, itemId, onTranslated, onClose])

  return (
    <BottomSheet open={open} onClose={onClose} title="Translate">
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Translate all paragraphs to Vietnamese. Translations are cached for future reads.
        </p>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Translating {progress} of {total} paragraphs...
            </p>
          </div>
        ) : (
          <button
            onClick={handleTranslateAll}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium active:bg-blue-700"
          >
            Translate All Paragraphs
          </button>
        )}
      </div>
    </BottomSheet>
  )
}
