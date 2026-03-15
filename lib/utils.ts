// Browser-compatible hash function (works in both Node.js and browser)
// Used as a cache key for translations — consistency matters, not crypto strength
export function md5(text: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const hash = (4294967296 * (2097151 & h2) + (h1 >>> 0))
  return hash.toString(16).padStart(16, '0')
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function splitParagraphs(content: string): string[] {
  return content
    .replace(/<[^>]*>/g, '\n')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 20)
}

// Split HTML content into block-level chunks, preserving inline formatting
export function splitHtmlIntoParagraphs(html: string): string[] {
  if (!html) return []

  // Check if content is HTML (contains tags) or plain text
  const isHtml = /<[a-z][\s\S]*>/i.test(html)

  if (!isHtml) {
    // Plain text: split by double newlines, wrap in <p>
    return html
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 10)
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
  }

  // HTML content: split by block-level elements
  const blocks: string[] = []
  let current = ''

  // Split HTML into lines and group by block elements
  const parts = html.split(/(<\/(?:p|h[1-6]|blockquote|ol|ul|li|div|section|article|figure|figcaption|pre|table)>|<hr\s*\/?>)/i)

  for (let i = 0; i < parts.length; i++) {
    current += parts[i]
    // If this part is a closing block tag or <hr>, flush current block
    if (i % 2 === 1) {
      const trimmed = current.trim()
      if (trimmed) blocks.push(trimmed)
      current = ''
    }
  }

  // Flush remaining
  if (current.trim()) blocks.push(current.trim())

  // Filter out empty blocks and very short ones (< 5 chars of text)
  return blocks.filter(block => {
    const textContent = block.replace(/<[^>]*>/g, '').trim()
    return textContent.length > 5
  })
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}
