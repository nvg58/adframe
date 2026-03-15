const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2'

export async function translateText(text: string): Promise<string> {
  const response = await fetch(
    `${GOOGLE_TRANSLATE_URL}?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: 'vi',
        format: 'text',
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Translation API error: ${response.status}`)
  }

  const data = await response.json()
  return data.data.translations[0].translatedText
}
