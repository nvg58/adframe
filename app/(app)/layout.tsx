import BottomNav from '@/components/ui/BottomNav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      <main>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
