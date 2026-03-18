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

  // HTML content: extract tables/lists as whole blocks first, then split rest by paragraphs
  const blocks: string[] = []

  // Step 1: Pull out <table>...</table> and <ol>...</ol> and <ul>...</ul> as whole blocks
  // Replace them with placeholders, then split the rest
  const preserved: string[] = []
  const placeholder = (i: number) => `<!--BLOCK_${i}-->`

  const processed = html.replace(/<(table|ol|ul)[\s\S]*?<\/\1>/gi, (match) => {
    const idx = preserved.length
    preserved.push(match)
    return placeholder(idx)
  })

  // Step 2: Split remaining content by block-level closing tags
  const parts = processed.split(/(<\/(?:p|h[1-6]|blockquote|div|section|article|figure|figcaption|pre)>|<hr\s*\/?>)/i)

  let current = ''
  for (let i = 0; i < parts.length; i++) {
    current += parts[i]
    if (i % 2 === 1) {
      const trimmed = current.trim()
      if (trimmed) blocks.push(trimmed)
      current = ''
    }
  }
  if (current.trim()) blocks.push(current.trim())

  // Step 3: Restore preserved blocks in place of placeholders
  const result: string[] = []
  for (const block of blocks) {
    const placeholderMatch = block.match(/<!--BLOCK_(\d+)-->/)
    if (placeholderMatch) {
      // If block is ONLY a placeholder, push the preserved block
      const idx = parseInt(placeholderMatch[1])
      const before = block.substring(0, placeholderMatch.index).trim()
      const after = block.substring(placeholderMatch.index! + placeholderMatch[0].length).trim()
      if (before) result.push(before)
      result.push(preserved[idx])
      if (after) result.push(after)
    } else {
      result.push(block)
    }
  }

  // Also check for any preserved blocks that weren't in any split part
  // (edge case: placeholder is the only content between two block elements)
  return result.filter(block => {
    const textContent = block.replace(/<[^>]*>/g, '').replace(/<!--BLOCK_\d+-->/g, '').trim()
    return textContent.length > 5 || /<(table|ol|ul)/i.test(block)
  })

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
