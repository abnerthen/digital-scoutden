// Routing and the invite guard.
//
// The guard matters: an invite link signs a user in *before* they have a
// password. If Root let them into the app, the invite session would expire and
// leave them with no credentials to sign back in with.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('./App.jsx', () => ({ default: () => <div>INVENTORY APP</div> }))
vi.mock('./components/Login.jsx', () => ({ default: () => <div>LOGIN PAGE</div> }))
vi.mock('./components/AuthCallback.jsx', () => ({ default: () => <div>CALLBACK PAGE</div> }))
vi.mock('./components/SetPassword.jsx', () => ({ default: () => <div>SET PASSWORD PAGE</div> }))
vi.mock('./lib/auth.js', () => ({ getSession: vi.fn() }))
vi.mock('./lib/supabase.js', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

import Root from './Root'
import { getSession } from './lib/auth.js'
import { setFlash } from './lib/flash.js'

function stubPath(pathname) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { pathname, search: '', hash: '', origin: 'http://localhost', replace: vi.fn() },
  })
}

const sessionFor = (user_metadata = {}) => ({ user: { id: 'u1', user_metadata } })

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  stubPath('/')
})

describe('routes', () => {
  it('serves the callback page at /auth/callback', async () => {
    stubPath('/auth/callback')
    getSession.mockResolvedValue(null)
    render(<Root />)
    expect(await screen.findByText('CALLBACK PAGE')).toBeInTheDocument()
  })

  // Reached with tokens in the URL and no stored session yet, so it must render
  // ahead of the sign-in gate.
  it('serves the set-password page at /auth/set-password without a session', async () => {
    stubPath('/auth/set-password')
    getSession.mockResolvedValue(null)
    render(<Root />)
    expect(await screen.findByText('SET PASSWORD PAGE')).toBeInTheDocument()
  })
})

describe('session gate', () => {
  it('shows the login page when signed out', async () => {
    getSession.mockResolvedValue(null)
    render(<Root />)
    expect(await screen.findByText('LOGIN PAGE')).toBeInTheDocument()
  })

  it('shows the app for a normal session', async () => {
    getSession.mockResolvedValue(sessionFor())
    render(<Root />)
    expect(await screen.findByText('INVENTORY APP')).toBeInTheDocument()
  })

  it('holds an invited user on the set-password page', async () => {
    getSession.mockResolvedValue(sessionFor({ must_set_password: true }))
    render(<Root />)
    expect(await screen.findByText('SET PASSWORD PAGE')).toBeInTheDocument()
    expect(screen.queryByText('INVENTORY APP')).not.toBeInTheDocument()
  })

  it('lets them through once the flag is cleared', async () => {
    getSession.mockResolvedValue(sessionFor({ must_set_password: false }))
    render(<Root />)
    expect(await screen.findByText('INVENTORY APP')).toBeInTheDocument()
  })
})

// The set-password page navigates with location.replace(), so the confirmation
// is handed over through sessionStorage rather than through React.
describe('flash message', () => {
  it('shows a queued message over the app', async () => {
    setFlash('Password changed.')
    getSession.mockResolvedValue(sessionFor())
    render(<Root />)

    await screen.findByText('INVENTORY APP')
    expect(screen.getByRole('status')).toHaveTextContent('Password changed.')
  })

  it('shows a queued message over the login page too', async () => {
    setFlash('Password changed.')
    getSession.mockResolvedValue(null)
    render(<Root />)

    await screen.findByText('LOGIN PAGE')
    expect(screen.getByRole('status')).toHaveTextContent('Password changed.')
  })

  it('shows nothing when no message is queued', async () => {
    getSession.mockResolvedValue(sessionFor())
    render(<Root />)

    await screen.findByText('INVENTORY APP')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  // Consumed on read, so re-mounting (a refresh) must not resurrect it.
  it('does not show the message again on a reload', async () => {
    setFlash('Password changed.')
    getSession.mockResolvedValue(sessionFor())

    const first = render(<Root />)
    await screen.findByText('INVENTORY APP')
    first.unmount()

    render(<Root />)
    await screen.findByText('INVENTORY APP')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
