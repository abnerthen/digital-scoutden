import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { setPassword } from '../lib/auth'
import { setFlash } from '../lib/flash'
import { modalTitleStyle, MIN_PASSWORD_LENGTH } from '../constants'

const cardStyle = {
  background: '#fff', borderRadius: 16, padding: 40, width: 360,
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
}
const pageStyle = {
  minHeight: '100vh', display: 'flex', alignItems: 'center',
  justifyContent: 'center', background: '#f5f0e8', fontFamily: 'serif',
}
const fieldLabelStyle = {
  display: 'block', fontSize: 12, fontWeight: 700, color: '#555',
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
}
const fieldStyle = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px',
  border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14,
  marginBottom: 16, fontFamily: 'inherit',
}

/**
 * Where an invited member chooses their password.
 *
 * An invite link carries tokens in the URL hash, so by the time this mounts the
 * user already has a session — they are signed in but have no password, and so
 * could never sign in again. Root keeps them here until they set one.
 *
 * Reachable with an existing session too, which makes it double as the
 * change-password page.
 */
export default function SetPasswordPage() {
  const [ready, setReady] = useState(false)
  const [linkError, setLinkError] = useState(null)
  const [password, setPasswordValue] = useState('')
  const [confirm, setConfirm] = useState('')
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function checkLink() {
      const search = new URLSearchParams(window.location.search)
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

      // An expired or already-used invite comes back as an error on the URL
      // rather than as a failed session, in the query or the hash.
      const urlError =
        search.get('error_description') || search.get('error') ||
        hash.get('error_description') || hash.get('error')
      if (urlError) {
        setLinkError(urlError)
        return
      }

      // The client parses tokens out of the URL itself (detectSessionInUrl is
      // on by default); getSession awaits that, so the session is settled here.
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        setLinkError(error.message)
        return
      }
      if (!data.session) {
        setLinkError(
          'This invite link is no longer valid. It may have expired or already been used — ask your troop leader to send a new one.'
        )
        return
      }
      setReady(true)
    }
    checkLink()
  }, [])

  const handleSubmit = async () => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Please use at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setFormError('Those two passwords do not match.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      await setPassword(password)
      // Parked in sessionStorage rather than state: the replace() below is a
      // full page load, so nothing in memory survives it.
      setFlash('Password changed.')
      // replace() so the URL holding the invite tokens is not left in history
      window.location.replace('/')
    } catch (err) {
      setFormError(err.message)
      setSaving(false)
    }
  }

  if (linkError) {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: 50, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ ...modalTitleStyle, color: '#c62828', margin: '0 0 12px' }}>
            Invite Link Problem
          </h2>
          <p style={{ color: '#555', fontSize: 14, lineHeight: 1.5, margin: '0 0 24px' }}>
            {linkError}
          </p>
          <button
            onClick={() => window.location.replace('/')}
            style={{
              padding: '10px 24px', background: '#2e7d32', color: '#fff',
              border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ color: '#888', fontSize: 13, margin: 0 }}>Checking your invite…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40 }}>⚜️</div>
          <h1 style={{ ...modalTitleStyle, margin: '8px 0 4px', fontSize: 28 }}>
            Set Your Password
          </h1>
          <p style={{ margin: 0, color: '#888', fontSize: 13 }}>
            Choose a password to finish setting up your account.
          </p>
        </div>

        <label style={fieldLabelStyle} htmlFor="new-password">New Password</label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={e => setPasswordValue(e.target.value)}
          placeholder="••••••••"
          style={fieldStyle}
        />

        <label style={fieldLabelStyle} htmlFor="confirm-password">Confirm Password</label>
        <input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="••••••••"
          style={fieldStyle}
        />

        <p style={{ color: '#888', fontSize: 12, margin: '0 0 12px' }}>
          At least {MIN_PASSWORD_LENGTH} characters.
        </p>

        {formError && (
          <p role="alert" style={{ color: '#c62828', fontSize: 13, margin: '0 0 12px' }}>
            {formError}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving || !password || !confirm}
          style={{
            width: '100%', padding: '12px 0',
            background: saving ? '#ccc' : '#2e7d32', color: '#fff',
            border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15,
            cursor: saving ? 'not-allowed' : 'pointer', marginTop: 4,
          }}
        >
          {saving ? 'Saving…' : 'Set Password'}
        </button>
      </div>
    </div>
  )
}
