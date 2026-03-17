import { useState, useEffect } from 'react'
import './index.css'
import App from './App.jsx'
import LoginPage from './components/Login.jsx'
import { getSession } from './lib/auth.js'
import { supabase } from './lib/supabase.js'

export default function Root() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    getSession().then(s => setSession(s))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  if (!session) return <LoginPage onLogin={() => getSession().then(setSession)} />
  return <App />
}