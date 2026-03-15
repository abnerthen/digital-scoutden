import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LoginPage from './components/Login.jsx'
import { getSession } from './lib/auth.js'
import { supabase } from './lib/supabase.js'

function Root() {
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

createRoot(document.getElementById('root')).render(<Root />)