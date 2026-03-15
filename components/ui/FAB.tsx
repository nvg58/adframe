import Link from 'next/link'

export default function FAB({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="fixed right-4 z-40 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg"
      style={{ bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + 16px)' }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </Link>
  )
}
