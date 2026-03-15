'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console for any browser that supports it
    try {
      console.error('[Adframe Error]', error.message, error.stack, info.componentStack)
    } catch {
      // Console not available
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          backgroundColor: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: '1.6',
          wordBreak: 'break-word',
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px', color: '#856404' }}>
            {this.props.fallbackMessage || 'Something went wrong'}
          </div>
          <div style={{ color: '#856404' }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
          {this.state.error?.stack && (
            <pre style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '11px',
              maxHeight: '300px',
              color: '#333',
            }}>
              {this.state.error.stack}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '12px',
              padding: '10px 20px',
              backgroundColor: '#ffc107',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
