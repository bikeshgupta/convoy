import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: '#080C14',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 24, zIndex: 9999,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontFamily: '"Bebas Neue", cursive', color: '#FF4D6D', fontSize: 36, marginBottom: 8 }}>
            Something went wrong
          </div>
          <p style={{ fontFamily: '"Space Mono", monospace', color: '#4A7A9B', fontSize: 13, textAlign: 'center', marginBottom: 24, maxWidth: 320 }}>
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              fontFamily: '"Space Mono", monospace', fontWeight: 700,
              background: '#00FF88', color: '#080C14',
              border: 'none', borderRadius: 12,
              padding: '12px 28px', fontSize: 13,
              letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
