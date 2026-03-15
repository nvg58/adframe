'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [user, setUser] = useState<{
    email?: string
    user_metadata?: { avatar_url?: string; full_name?: string }
  } | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="p-4 pt-8 flex justify-center">
        <div className="animate-pulse text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Profile</h1>

      {/* User card */}
      <div className="p-5 bg-gray-50 dark:bg-[#262626] rounded-2xl mb-6">
        <div className="flex items-center gap-4">
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt=""
              className="w-14 h-14 rounded-full"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
              {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {user.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-xl text-sm font-medium"
      >
        Log Out
      </button>
    </div>
  )
}
