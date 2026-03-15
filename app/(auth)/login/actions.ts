'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

function getOrigin() {
  const headersList = headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') || 'https'
  return `${proto}://${host}`
}

export async function sendOtp(formData: FormData) {
  const email = formData.get('email') as string
  if (!email) {
    redirect('/login?error=Email+is+required')
  }

  const supabase = createClient()
  const origin = getOrigin()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/login?step=otp&email=${encodeURIComponent(email)}`)
}

export async function verifyOtp(formData: FormData) {
  const email = formData.get('email') as string
  const token = formData.get('otp') as string

  if (!email || !token) {
    redirect('/login?error=Email+and+OTP+are+required')
  }

  const supabase = createClient()

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    redirect(`/login?step=otp&email=${encodeURIComponent(email)}&error=${encodeURIComponent(error.message)}`)
  }

  redirect('/inbox')
}
