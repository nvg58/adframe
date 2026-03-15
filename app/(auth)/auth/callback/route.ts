import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

function getOrigin(request: NextRequest) {
  // On Vercel, request.url may resolve to the deployment URL instead of the
  // production alias. Use x-forwarded-host header to get the real hostname.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  // Fallback: use NEXT_PUBLIC_APP_URL if set, otherwise request.url origin
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  return new URL(request.url).origin
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const origin = getOrigin(request)

  const supabase = createClient()

  // Handle OAuth callback (code exchange)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/inbox`)
    }
  }

  // Handle magic link / email OTP verification via URL
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email' | 'magiclink',
    })
    if (!error) {
      return NextResponse.redirect(`${origin}/inbox`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
