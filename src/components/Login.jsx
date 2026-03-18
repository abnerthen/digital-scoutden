import React, { useState } from 'react'
import { signIn } from '../lib/auth'
import { modalTitleStyle } from '../constants'
import troop_logo from '../assets/troop_logo.png'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
      onLogin()
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f0e8', fontFamily: 'serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {/* <div style={{ fontSize: 40 }}>⚜️</div> */}
          <img 
            src={troop_logo}
            alt="Troop Logo"
            style={{ width: 100, height: 100, objectFit: 'contain'}}
          />
          <h1 style={{ ...modalTitleStyle, margin: '8px 0 4px', fontSize: 40 }}>Storeroom Ledger</h1>
          <p style={{ margin: 0, color: '#888', fontSize: 13 }}>Scout Quartermaster System</p>
        </div>

        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, marginBottom: 16, fontFamily: 'inherit' }}
        />

        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="••••••••"
          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, marginBottom: 8, fontFamily: 'inherit' }}
        />

        {error && <p style={{ color: '#c62828', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          style={{ width: '100%', padding: '12px 0', background: loading ? '#ccc' : '#2e7d32', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}