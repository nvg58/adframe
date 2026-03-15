import BottomNav from '@/components/ui/BottomNav'
import { ReaderSettingsProvider } from '@/lib/reader-settings'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ReaderSettingsProvider>
      <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
        <main className="pb-safe-nav">
          {children}
        </main>
        <BottomNav />
      </div>
    </ReaderSettingsProvider>
  )
}
