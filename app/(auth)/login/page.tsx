import { sendOtp, verifyOtp } from './actions'
import GoogleButton from './GoogleButton'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { step?: string; email?: string; error?: string }
}) {
  const step = searchParams.step || 'idle'
  const email = searchParams.email || ''
  const error = searchParams.error || ''

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111', margin: '0 0 8px' }}>Adframe</h1>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            Collect copywriting lessons &amp; manage your swipe file
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', color: '#DC2626', fontSize: '14px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Google OAuth - only works with JS */}
        <GoogleButton />

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#D1D5DB' }} />
          <span style={{ fontSize: '14px', color: '#9CA3AF' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#D1D5DB' }} />
        </div>

        {/* Email OTP - works without JS via server actions */}
        {step === 'otp' ? (
          <form action={verifyOtp}>
            <input type="hidden" name="email" value={email} />
            <p style={{ fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '8px' }}>
              Check your email at <strong style={{ color: '#111' }}>{email}</strong>
            </p>
            <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', marginBottom: '16px' }}>
              Enter the 8-digit code, or click the magic link in the email
            </p>
            <input
              type="text"
              name="otp"
              required
              maxLength={8}
              autoComplete="one-time-code"
              placeholder="00000000"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '0.15em',
                border: '1px solid #D1D5DB',
                borderRadius: '12px',
                backgroundColor: '#fff',
                color: '#111',
                marginBottom: '12px',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2563EB',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                marginBottom: '8px',
              }}
            >
              Confirm
            </button>
            <a
              href="/login"
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                textAlign: 'center',
                color: '#666',
                border: '1px solid #D1D5DB',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              Go Back
            </a>
          </form>
        ) : (
          <form action={sendOtp}>
            <input
              type="email"
              name="email"
              required
              placeholder="your@email.com"
              defaultValue={email}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: '12px',
                backgroundColor: '#fff',
                color: '#111',
                fontSize: '14px',
                marginBottom: '12px',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2563EB',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Sign in with Email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
