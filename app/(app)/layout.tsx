import BottomNav from '@/components/ui/BottomNav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="bg-white dark:bg-[#1a1a1a]">
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
