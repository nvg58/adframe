chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_CONTENT') {
    let extractor;
    if (isSkoolPage()) {
      extractor = extractSkool();
    } else if (isGoogleDocsPage()) {
      extractor = extractGoogleDocs();
    } else {
      extractor = extractGeneric();
    }
    extractor
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

function isSkoolPage() {
  return location.hostname.endsWith('skool.com');
}

function isGoogleDocsPage() {
  return location.hostname === 'docs.google.com' && location.pathname.includes('/document/');
}

async function extractSkool() {
  const el = document.getElementById('__NEXT_DATA__');
  if (!el) return { success: false, error: "Could not find article data." };

  const data = JSON.parse(el.textContent);
  const post = data?.props?.pageProps?.postTree?.post;
  const meta = post?.metadata || {};
  const user = post?.user || {};

  const title = meta.title || document.title.replace(/\s*·.*$/, '').trim();
  const author = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const markdownContent = meta.content || '';
  const content = skoolMarkdownToHtml(markdownContent);

  return {
    success: true,
    title,
    content,
    author,
    url: window.location.href,
    siteName: 'Skool',
  };
}

// Convert Skool markdown to clean HTML preserving formatting
function skoolMarkdownToHtml(md) {
  if (!md) return '';

  // Unescape special characters
  let text = md.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, '$1');

  // Convert @mentions: [@Name](obj://...) → <span class="mention">@Name</span>
  text = text.replace(/\[(@[^\]]+)\]\(obj:\/\/[^)]+\)/g, '<span class="mention">$1</span>');

  // Convert links: [text](url) → <a href="url">text</a>
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>');

  // Convert Skool custom list tags: [ul][li]...[/li][/ul]
  text = text.replace(/\[ul\]/g, '<ul>');
  text = text.replace(/\[\/ul\]/g, '</ul>');
  text = text.replace(/\[li\]/g, '<li>');
  text = text.replace(/\[\/li\]/g, '</li>');

  // Split into lines for block-level processing
  const lines = text.split('\n');
  const htmlLines = [];
  let inBlockquote = false;
  let inList = false;
  let listBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim())) {
      if (inBlockquote) {
        htmlLines.push('</blockquote>');
        inBlockquote = false;
      }
      if (inList) {
        htmlLines.push(flushList(listBuffer));
        listBuffer = [];
        inList = false;
      }
      htmlLines.push('<hr>');
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      if (inBlockquote) { htmlLines.push('</blockquote>'); inBlockquote = false; }
      if (inList) { htmlLines.push(flushList(listBuffer)); listBuffer = []; inList = false; }
      const level = headingMatch[1].length;
      htmlLines.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ') || line === '>') {
      if (inList) { htmlLines.push(flushList(listBuffer)); listBuffer = []; inList = false; }
      if (!inBlockquote) {
        htmlLines.push('<blockquote>');
        inBlockquote = true;
      }
      const quoteText = line.replace(/^>\s?/, '');
      if (quoteText) {
        htmlLines.push(`<p>${formatInline(quoteText)}</p>`);
      }
      continue;
    } else if (inBlockquote) {
      htmlLines.push('</blockquote>');
      inBlockquote = false;
    }

    // Ordered list items: "1. text"
    const listMatch = line.match(/^\d+\.\s+(.+)$/);
    if (listMatch) {
      if (!inList) { inList = true; }
      listBuffer.push(formatInline(listMatch[1]));
      continue;
    } else if (inList) {
      htmlLines.push(flushList(listBuffer));
      listBuffer = [];
      inList = false;
    }

    // Empty line — paragraph break
    if (line.trim() === '') {
      htmlLines.push('');
      continue;
    }

    // Regular text line
    htmlLines.push(line);
  }

  // Close any open blocks
  if (inBlockquote) htmlLines.push('</blockquote>');
  if (inList) htmlLines.push(flushList(listBuffer));

  // Now wrap consecutive text lines in <p> tags
  const result = [];
  let paragraphBuffer = [];

  for (const line of htmlLines) {
    // Block-level elements pass through
    if (line === '' || line.startsWith('<h') || line.startsWith('<hr') ||
        line.startsWith('<blockquote') || line.startsWith('</blockquote') ||
        line.startsWith('<ol') || line.startsWith('<ul') ||
        line.startsWith('<p>') || line.startsWith('<li')) {
      // Flush any buffered paragraph text
      if (paragraphBuffer.length > 0) {
        result.push(`<p>${formatInline(paragraphBuffer.join('<br>'))}</p>`);
        paragraphBuffer = [];
      }
      if (line !== '') result.push(line);
    } else {
      paragraphBuffer.push(line);
    }
  }

  // Flush remaining paragraph
  if (paragraphBuffer.length > 0) {
    result.push(`<p>${formatInline(paragraphBuffer.join('<br>'))}</p>`);
  }

  return result.join('\n');
}

// Format inline markdown: bold, italic
function formatInline(text) {
  // Bold: **text**
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* (not preceded/followed by *)
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  return text;
}

// Flush ordered list buffer into <ol>
function flushList(items) {
  if (items.length === 0) return '';
  return '<ol>' + items.map(item => `<li>${item}</li>`).join('') + '</ol>';
}

// Keep plain text version for backward compatibility
function skoolMarkdownToText(md) {
  if (!md) return '';
  return md
    .replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, '$1')
    .replace(/\[(@[^\]]+)\]\(obj:\/\/[^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1')
    .replace(/\[ul\]|\[\/ul\]|\[li\]|\[\/li\]/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
    .replace(/^#{1,3} /gm, '')
    .trim();
}

async function extractGoogleDocs() {
  const title = document.querySelector('.docs-title-input')?.value
    || document.title.replace(/ - Google Docs$/, '').trim()
    || 'Untitled';

  // Strategy 1: Published Google Docs (/pub) — regular HTML
  if (location.pathname.endsWith('/pub')) {
    const content = document.querySelector('#contents');
    if (content) {
      return {
        success: true,
        title,
        content: content.innerHTML,
        author: '',
        url: window.location.href,
        siteName: 'Google Docs',
      };
    }
  }

  // Strategy 2: Editor view — extract from kix renderer
  const paragraphs = document.querySelectorAll('.kix-paragraphrenderer');
  if (paragraphs.length > 0) {
    const lines = [];
    for (const para of paragraphs) {
      // Get text from word nodes
      const words = para.querySelectorAll('.kix-wordhtmlgenerator-word-node');
      if (words.length > 0) {
        const text = Array.from(words).map(w => w.textContent).join('');
        if (text.trim()) lines.push(text.trim());
      } else {
        // Fallback: get innerText of the paragraph
        const text = para.innerText?.trim();
        if (text) lines.push(text);
      }
    }

    if (lines.length > 0) {
      // Convert to simple HTML paragraphs
      const content = lines.map(l => `<p>${l}</p>`).join('\n');
      return {
        success: true,
        title,
        content,
        author: '',
        url: window.location.href,
        siteName: 'Google Docs',
      };
    }
  }

  // Strategy 3: Try selecting all text via the accessible view
  // Google Docs has an accessibility mode with .docs-texteventtarget-iframe
  const textEl = document.querySelector('.doc-content') || document.querySelector('[role="document"]');
  if (textEl) {
    const text = textEl.innerText?.trim();
    if (text && text.length > 50) {
      const content = text.split(/\n\n+/).filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('\n');
      return {
        success: true,
        title,
        content,
        author: '',
        url: window.location.href,
        siteName: 'Google Docs',
      };
    }
  }

  return { success: false, error: 'Could not extract Google Docs content. Try selecting all text (Ctrl+A), copying (Ctrl+C), and pasting into the content field.' };
}

async function extractGeneric() {
  const documentClone = document.cloneNode(true);
  const reader = new Readability(documentClone);
  const article = reader.parse();

  if (!article) return { success: false, error: "Could not extract content from this page." };

  return {
    success: true,
    title: article.title || document.title || 'Untitled',
    content: article.content || article.textContent.trim(),
    author: article.byline || '',
    url: window.location.href,
    siteName: article.siteName || location.hostname,
  };
}
