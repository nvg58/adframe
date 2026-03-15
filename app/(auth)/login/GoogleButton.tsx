'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function GoogleButton() {
  const [error, setError] = useState('')
  const [debug, setDebug] = useState('')

  const handleClick = async () => {
    setError('')
    setDebug('Starting Google login...')
    try {
      const origin = window.location.origin
      setDebug(`Origin: ${origin}`)
      const supabase = createClient()
      setDebug(`Client created. Calling signInWithOAuth...`)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      })
      if (error) {
        setError(`Google login failed: ${error.message}`)
        setDebug(`Error: ${error.message}`)
      } else {
        setDebug(`OAuth URL: ${data?.url || 'no url'}`)
        // If signInWithOAuth didn't auto-redirect, manually navigate
        if (data?.url) {
          setDebug(`Redirecting manually...`)
          window.location.href = data.url
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(`Google login error: ${msg}`)
      setDebug(`Catch: ${msg}`)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        type="button"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '12px 16px',
          border: '1px solid #D1D5DB',
          borderRadius: '12px',
          backgroundColor: '#fff',
          color: '#374151',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          boxSizing: 'border-box' as const,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign in with Google
      </button>
      {error && (
        <div style={{ padding: '10px', marginTop: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '13px', textAlign: 'center' as const }}>
          {error}
        </div>
      )}
      {debug && (
        <div style={{ padding: '8px', marginTop: '8px', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px', color: '#0369A1', fontSize: '11px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' as const, wordBreak: 'break-all' as const }}>
          {debug}
        </div>
      )}
    </>
  )
}
