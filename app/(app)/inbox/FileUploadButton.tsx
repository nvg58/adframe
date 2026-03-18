'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomSheet from '@/components/ui/BottomSheet'

export default function FileUploadButton() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setOpen(false)
    setUploading(true)
    setError('')
    setResult('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/inbox/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        setResult(data.message || `Added ${data.items.length} items`)
        router.refresh()
        // Clear result after 3 seconds
        setTimeout(() => setResult(''), 3000)
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch {
      setError('Network error. Check your connection.')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept=".epub,.docx,.txt"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Status toast */}
      {(uploading || error || result) && (
        <div style={{
          position: 'fixed', bottom: '80px', left: '16px', right: '80px',
          zIndex: 45, padding: '12px 16px', borderRadius: '12px',
          fontSize: '14px', fontWeight: 500,
          backgroundColor: error ? '#fef2f2' : result ? '#f0fdf4' : '#f3f4f6',
          color: error ? '#b91c1c' : result ? '#166534' : '#374151',
          border: `1px solid ${error ? '#fecaca' : result ? '#bbf7d0' : '#e5e7eb'}`,
        }}>
          {uploading && 'Parsing file...'}
          {error && error}
          {result && result}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        disabled={uploading}
        style={{
          position: 'fixed', right: '16px', bottom: '80px', zIndex: 40,
          width: '56px', height: '56px',
          backgroundColor: uploading ? '#93c5fd' : '#2563eb', color: '#fff',
          borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: 'none', cursor: uploading ? 'wait' : 'pointer',
        }}
      >
        {uploading ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4" /><path d="M12 18v4" /><path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="M4.93 19.07l2.83-2.83" /><path d="M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </button>

      {/* BottomSheet with options */}
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Add to Inbox">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Paste content */}
          <a
            href="/inbox/new"
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 16px', borderRadius: '12px',
              border: '1px solid #e5e7eb', textDecoration: 'none', color: '#111',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>Paste content</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                Manually paste text or HTML
              </div>
            </div>
          </a>

          {/* Upload file */}
          <button
            onClick={() => {
              setOpen(false)
              fileRef.current?.click()
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 16px', borderRadius: '12px',
              border: '1px solid #e5e7eb', background: 'none',
              cursor: 'pointer', textAlign: 'left', width: '100%',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: '#111' }}>Upload file</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                .epub, .docx, .txt
              </div>
            </div>
          </button>
        </div>
      </BottomSheet>
    </>
  )
}
