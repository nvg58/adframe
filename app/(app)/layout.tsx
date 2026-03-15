import BottomNav from '@/components/ui/BottomNav'
import { ReaderSettingsProvider } from '@/lib/reader-settings'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary fallbackMessage="App crashed — error details below">
      <ReaderSettingsProvider>
        <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
          <main className="pb-safe-nav">
            {children}
          </main>
          <BottomNav />
        </div>
      </ReaderSettingsProvider>
    </ErrorBoundary>
  )
}
