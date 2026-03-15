import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const bookerly = localFont({
  src: [
    { path: './fonts/Bookerly Light.ttf', weight: '300', style: 'normal' },
    { path: './fonts/Bookerly Light Italic.ttf', weight: '300', style: 'italic' },
    { path: './fonts/Bookerly.ttf', weight: '400', style: 'normal' },
    { path: './fonts/Bookerly Italic.ttf', weight: '400', style: 'italic' },
    { path: './fonts/Bookerly Bold.ttf', weight: '700', style: 'normal' },
    { path: './fonts/Bookerly Bold Italic.ttf', weight: '700', style: 'italic' },
  ],
  variable: '--font-bookerly',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Adframe',
  description: 'Collect copywriting lessons, swipe files, and track ad tests',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={bookerly.variable}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
