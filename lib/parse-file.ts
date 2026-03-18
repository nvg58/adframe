import EPub from 'epub2'
import mammoth from 'mammoth'

export type ParsedItem = {
  title: string
  content: string
  source_author?: string
  tags: string[]
}

export type ParseResult = {
  items: ParsedItem[]
}

export async function parseUploadedFile(
  buffer: Buffer,
  filename: string
): Promise<ParseResult> {
  const ext = filename.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'epub':
      return parseEpub(buffer, filename)
    case 'docx':
      return parseDocx(buffer, filename)
    case 'txt':
      return parseTxt(buffer, filename)
    default:
      throw new Error(`Unsupported file type: .${ext}. Supported: .epub, .docx, .txt`)
  }
}

async function parseEpub(buffer: Buffer, filename: string): Promise<ParseResult> {
  const epub = await EPub.createAsync(buffer as unknown as string, undefined, undefined)
  const metadata = epub.metadata || {}
  const bookTitle = metadata.title || filename.replace(/\.epub$/i, '')
  const author = metadata.creator || ''

  const chapters = epub.flow || []
  const items: ParsedItem[] = []

  for (const chapter of chapters) {
    if (!chapter.id) continue
    try {
      const html = await new Promise<string>((resolve, reject) => {
        epub.getChapter(chapter.id, (err: Error | null, text: string) => {
          if (err) reject(err)
          else resolve(text || '')
        })
      })

      if (!html || html.trim().length < 20) continue

      // Strip html/head/body wrappers, keep inner content
      const content = html
        .replace(/<\/?html[^>]*>/gi, '')
        .replace(/<head[\s\S]*?<\/head>/gi, '')
        .replace(/<\/?body[^>]*>/gi, '')
        .trim()

      if (!content || content.length < 20) continue

      const chapterTitle = chapter.title || extractFirstHeading(content) || `Chapter ${items.length + 1}`

      items.push({
        title: `${bookTitle} - ${chapterTitle}`,
        content,
        source_author: author || undefined,
        tags: ['epub', bookTitle],
      })
    } catch {
      // Skip unreadable chapters
    }
  }

  if (items.length === 0) {
    throw new Error('Could not extract any chapters from this EPUB file.')
  }

  return { items }
}

function extractFirstHeading(html: string): string | null {
  const match = html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)
  if (match) {
    return match[1].replace(/<[^>]*>/g, '').trim() || null
  }
  return null
}

async function parseDocx(buffer: Buffer, filename: string): Promise<ParseResult> {
  const result = await mammoth.convertToHtml({ buffer })
  const content = result.value?.trim()

  if (!content || content.length < 10) {
    throw new Error('Could not extract content from this DOCX file.')
  }

  const title = filename.replace(/\.docx$/i, '')

  return {
    items: [{
      title,
      content,
      tags: ['docx'],
    }],
  }
}

async function parseTxt(buffer: Buffer, filename: string): Promise<ParseResult> {
  const text = buffer.toString('utf-8').trim()

  if (!text || text.length < 10) {
    throw new Error('The text file appears to be empty.')
  }

  // Wrap paragraphs in <p> tags
  const content = text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n')

  const title = filename.replace(/\.txt$/i, '')

  return {
    items: [{
      title,
      content,
      tags: ['txt'],
    }],
  }
}
