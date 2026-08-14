import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthCallbackPage() {
  const [error, setError] = useState(null)

  useEffect(() => {
    async function completeSignIn() {
      const search = new URLSearchParams(window.location.search)
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

      // Providers report failures on the URL itself, in the query or the hash
      const providerError =
        search.get('error_description') || search.get('error') ||
        hash.get('error_description') || hash.get('error')
      if (providerError) {
        setError(providerError)
        return
      }

      // Nothing to exchange — someone opened this route directly
      if (!search.has('code') && !hash.has('access_token')) {
        window.location.replace('/')
        return
      }

      // The client is created with detectSessionInUrl (the default), so it parses the
      // code or token out of the URL itself. getSession() awaits that initialisation,
      // so by the time it resolves the session is either stored or it failed.
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        setError(sessionError.message)
        return
      }
      if (!data.session) {
        setError('Could not establish a session from this sign-in link. It may have already been used or expired.')
        return
      }

      // replace() so the URL holding the tokens is not left in browser history
      window.location.replace('/')
    }
    completeSignIn()
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
              onClick={() => { window.location.replace('/') }}
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
