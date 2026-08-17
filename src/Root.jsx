import { useState, useEffect, useCallback } from 'react'
import './index.css'
import App from './App.jsx'
import LoginPage from './components/Login.jsx'
import AuthCallbackPage from './components/AuthCallback.jsx'
import SetPasswordPage from './components/SetPassword.jsx'
import Toast from './components/elements/Toast.jsx'
import { getSession } from './lib/auth.js'
import { supabase } from './lib/supabase.js'
import { takeFlash } from './lib/flash.js'

export default function Root() {
  const [session, setSession] = useState(undefined)
  // Read once on mount and clear, so a refresh does not show it again.
  const [flash, setFlashMessage] = useState(takeFlash)
  // Stable, so Toast's dismiss timer is not restarted by a re-render.
  const dismissFlash = useCallback(() => setFlashMessage(null), [])

  useEffect(() => {
    getSession().then(s => setSession(s))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Route checks come before the session gate: both pages establish the session
  // themselves, from tokens on the URL.
  const path = window.location.pathname
  if (path === '/auth/callback') return <AuthCallbackPage />
  if (path === '/auth/set-password') return <SetPasswordPage />

  if (session === undefined) return null
  if (!session) {
    return (
      <>
        <LoginPage onLogin={() => getSession().then(setSession)} />
        <Toast message={flash} onDismiss={dismissFlash} />
      </>
    )
  }

  // An invite signs the user in before they have a password. Letting them into
  // the app here would strand them: the invite session eventually expires and
  // they have no credentials to sign back in with.
  if (session.user?.user_metadata?.must_set_password) return <SetPasswordPage />

  return (
    <>
      <App />
      <Toast message={flash} onDismiss={dismissFlash} />
    </>
  )
}