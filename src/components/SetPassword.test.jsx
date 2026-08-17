import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../lib/supabase', () => ({
  supabase: { auth: { getSession: vi.fn() } },
}))
vi.mock('../lib/auth', () => ({ setPassword: vi.fn() }))

import SetPasswordPage from './SetPassword'
import { supabase } from '../lib/supabase'
import { setPassword } from '../lib/auth'
import { takeFlash } from '../lib/flash'

const replace = vi.fn()

/** jsdom's location is read-only, so swap the whole object per test. */
function stubLocation({ search = '', hash = '' } = {}) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { pathname: '/auth/set-password', search, hash, origin: 'http://localhost', replace },
  })
}

const withSession = () =>
  supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null })

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  stubLocation()
})

/** Render and wait past the "checking your invite" state. */
async function renderReady() {
  withSession()
  render(<SetPasswordPage />)
  return screen.findByLabelText(/new password/i)
}

describe('invite link handling', () => {
  it('shows the form once the invite session is established', async () => {
    await renderReady()
    expect(screen.getByRole('button', { name: /set password/i })).toBeInTheDocument()
  })

  it('reports an expired or already-used link', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    render(<SetPasswordPage />)
    expect(await screen.findByText(/no longer valid/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument()
  })

  // Supabase reports a dead link on the URL rather than as a failed session.
  it('surfaces an error carried on the URL hash', async () => {
    stubLocation({ hash: '#error=access_denied&error_description=Invite+has+expired' })
    render(<SetPasswordPage />)
    expect(await screen.findByText(/invite has expired/i)).toBeInTheDocument()
    expect(supabase.auth.getSession).not.toHaveBeenCalled()
  })

  it('surfaces an error carried on the query string', async () => {
    stubLocation({ search: '?error_description=Token+has+expired' })
    render(<SetPasswordPage />)
    expect(await screen.findByText(/token has expired/i)).toBeInTheDocument()
  })
})

describe('password validation', () => {
  it('refuses a password shorter than the minimum', async () => {
    const user = userEvent.setup()
    const pw = await renderReady()

    await user.type(pw, 'short')
    await user.type(screen.getByLabelText(/confirm password/i), 'short')
    await user.click(screen.getByRole('button', { name: /set password/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 8 characters/i)
    expect(setPassword).not.toHaveBeenCalled()
  })

  it('refuses a mismatched confirmation', async () => {
    const user = userEvent.setup()
    const pw = await renderReady()

    await user.type(pw, 'correct-horse')
    await user.type(screen.getByLabelText(/confirm password/i), 'correct-hoarse')
    await user.click(screen.getByRole('button', { name: /set password/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/do not match/i)
    expect(setPassword).not.toHaveBeenCalled()
  })

  it('keeps the button disabled until both fields are filled', async () => {
    const user = userEvent.setup()
    const pw = await renderReady()

    expect(screen.getByRole('button', { name: /set password/i })).toBeDisabled()
    await user.type(pw, 'correct-horse')
    expect(screen.getByRole('button', { name: /set password/i })).toBeDisabled()
    await user.type(screen.getByLabelText(/confirm password/i), 'correct-horse')
    expect(screen.getByRole('button', { name: /set password/i })).toBeEnabled()
  })
})

describe('saving', () => {
  it('sets the password and returns to the app', async () => {
    const user = userEvent.setup()
    setPassword.mockResolvedValue({})
    const pw = await renderReady()

    await user.type(pw, 'correct-horse')
    await user.type(screen.getByLabelText(/confirm password/i), 'correct-horse')
    await user.click(screen.getByRole('button', { name: /set password/i }))

    await waitFor(() => expect(setPassword).toHaveBeenCalledWith('correct-horse'))
    // replace(), not assign() — the invite tokens must not stay in history
    expect(replace).toHaveBeenCalledWith('/')
  })

  // replace() reloads the page, so the confirmation has to outlive React.
  it('queues the confirmation before navigating away', async () => {
    const user = userEvent.setup()
    setPassword.mockResolvedValue({})
    const pw = await renderReady()

    await user.type(pw, 'correct-horse')
    await user.type(screen.getByLabelText(/confirm password/i), 'correct-horse')
    await user.click(screen.getByRole('button', { name: /set password/i }))

    await waitFor(() => expect(takeFlash()).toBe('Password changed.'))
  })

  it('queues nothing when saving fails', async () => {
    const user = userEvent.setup()
    setPassword.mockRejectedValue(new Error('Password is too weak'))
    const pw = await renderReady()

    await user.type(pw, 'correct-horse')
    await user.type(screen.getByLabelText(/confirm password/i), 'correct-horse')
    await user.click(screen.getByRole('button', { name: /set password/i }))

    await screen.findByRole('alert')
    expect(takeFlash()).toBe(null)
  })

  it('surfaces a failure from Supabase and stays put', async () => {
    const user = userEvent.setup()
    setPassword.mockRejectedValue(new Error('Password is too weak'))
    const pw = await renderReady()

    await user.type(pw, 'correct-horse')
    await user.type(screen.getByLabelText(/confirm password/i), 'correct-horse')
    await user.click(screen.getByRole('button', { name: /set password/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/too weak/i)
    expect(replace).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /set password/i })).toBeEnabled()
  })
})
