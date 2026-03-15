'use client'

import { splitHtmlIntoParagraphs } from '@/lib/utils'

export default function ReaderContent({
  html,
  className = '',
}: {
  html: string
  className?: string
}) {
  const paragraphs = splitHtmlIntoParagraphs(html)

  return (
    <div className={`reader-content ${className}`}>
      {paragraphs.map((para, i) => (
        <div
          key={i}
          dangerouslySetInnerHTML={{ __html: para }}
        />
      ))}
    </div>
  )
}
