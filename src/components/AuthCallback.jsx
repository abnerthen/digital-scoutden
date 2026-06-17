import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthCallbackPage() {
  const [error, setError] = useState(null)

  useEffect(() => {
    async function exchangeCode() {
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          // Redirect to home page
          window.location.href = '/'
        } catch (err) {
          console.error('Error exchanging code:', err)
          setError(err.message || 'Authentication failed. The link may have expired.')
        }
      } else {
        // No code found, redirect home
        window.location.href = '/'
      }
    }
    exchangeCode()
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f0e8', fontFamily: 'serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        {error ? (
          <>
            <div style={{ fontSize: 50, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#c62828', margin: '0 0 12px' }}>Authentication Error</h2>
            <p style={{ color: '#555', fontSize: 14, lineHeight: 1.5, margin: '0 0 24px' }}>{error}</p>
            <button
              onClick={() => { window.location.href = '/' }}
              style={{ padding: '10px 24px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              Back to Sign In
            </button>
          </>
        ) : (
          <>
            <div style={{
              width: 50,
              height: 50,
              border: '4px solid #f5f0e8',
              borderTop: '4px solid #2e7d32',
              borderRadius: '50%',
              margin: '0 auto 20px',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#2e7d32', margin: '0 0 12px' }}>Completing Sign In</h2>
            <p style={{ color: '#888', fontSize: 13, margin: 0 }}>Please wait while we verify your credentials...</p>
          </>
        )}
      </div>
    </div>
  )
}
