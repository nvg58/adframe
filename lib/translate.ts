const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2'

export async function translateText(text: string): Promise<string> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_TRANSLATE_API_KEY is not configured')
  }

  const response = await fetch(
    `${GOOGLE_TRANSLATE_URL}?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://adframe.vercel.app',
      },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: 'vi',
        format: 'text',
      }),
    }
  )

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    throw new Error(`Translation API error ${response.status}: ${errBody}`)
  }

  const data = await response.json()
  return data.data.translations[0].translatedText
}
