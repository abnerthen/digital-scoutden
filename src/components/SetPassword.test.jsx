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

describe('the requirements checklist', () => {
  const item = (label) =>
    screen.getByText(label, { selector: 'li *' }).closest('li')

  it('lists every requirement up front', async () => {
    await renderReady()
    const list = screen.getByRole('list', { name: /password requirements/i })
    expect(list).toBeInTheDocument()
    for (const label of [
      'at least 8 characters', 'a small letter', 'a capital letter',
      'a number', 'a special character',
    ]) {
      expect(screen.getByText(label, { selector: 'li *' })).toBeInTheDocument()
    }
  })

  // The point of the change: which requirement is unmet, as you type, rather
  // than a wall of character classes from the server after submitting.
  it('ticks requirements off as they are met', async () => {
    const user = userEvent.setup()
    const pw = await renderReady()

    await user.type(pw, 'password')
    expect(item('a small letter')).toHaveAttribute('data-met', 'true')
    expect(item('at least 8 characters')).toHaveAttribute('data-met', 'true')
    expect(item('a capital letter')).toHaveAttribute('data-met', 'false')
    expect(item('a number')).toHaveAttribute('data-met', 'false')
    expect(item('a special character')).toHaveAttribute('data-met', 'false')

    await user.type(pw, 'P1!')
    for (const label of [
      'at least 8 characters', 'a small letter', 'a capital letter',
      'a number', 'a special character',
    ]) {
      expect(item(label)).toHaveAttribute('data-met', 'true')
    }
  })

  it('will not submit until every requirement is met', async () => {
    const user = userEvent.setup()
    const pw = await renderReady()

    await user.type(pw, 'password')
    await user.type(screen.getByLabelText(/confirm password/i), 'password')
    expect(screen.getByRole('button', { name: /set password/i })).toBeDisabled()

    await user.type(pw, 'P1!')
    await user.type(screen.getByLabelText(/confirm password/i), 'P1!')
    expect(screen.getByRole('button', { name: /set password/i })).toBeEnabled()
  })
})

describe('password validation', () => {
  it('names what a weak password is missing', async () => {
    const user = userEvent.setup()
    const pw = await renderReady()

    await user.type(pw, 'short')
    await user.type(screen.getByLabelText(/confirm password/i), 'short')
    await user.keyboard('{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /at least 8 characters, a capital letter, a number and a special character/i
    )
    expect(setPassword).not.toHaveBeenCalled()
  })

  it('refuses a mismatched confirmation', async () => {
    const user = userEvent.setup()
    const pw = await renderReady()

    await user.type(pw, 'Correct-Horse1')
    await user.type(screen.getByLabelText(/confirm password/i), 'Correct-Hoarse1')
    await user.click(screen.getByRole('button', { name: /set password/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/do not match/i)
    expect(setPassword).not.toHaveBeenCalled()
  })

  it('keeps the button disabled until both fields are filled', async () => {
    const user = userEvent.setup()
    const pw = await renderReady()

    expect(screen.getByRole('button', { name: /set password/i })).toBeDisabled()
    await user.type(pw, 'Correct-Horse1')
    expect(screen.getByRole('button', { name: /set password/i })).toBeDisabled()
    await user.type(screen.getByLabelText(/confirm password/i), 'Correct-Horse1')
    expect(screen.getByRole('button', { name: /set password/i })).toBeEnabled()
  })
})

describe('saving', () => {
  it('sets the password and returns to the app', async () => {
    const user = userEvent.setup()
    setPassword.mockResolvedValue({})
    const pw = await renderReady()

    await user.type(pw, 'Correct-Horse1')
    await user.type(screen.getByLabelText(/confirm password/i), 'Correct-Horse1')
    await user.click(screen.getByRole('button', { name: /set password/i }))

    await waitFor(() => expect(setPassword).toHaveBeenCalledWith('Correct-Horse1'))
    // replace(), not assign() — the invite tokens must not stay in history
    expect(replace).toHaveBeenCalledWith('/')
  })

  // replace() reloads the page, so the confirmation has to outlive React.
  it('queues the confirmation before navigating away', async () => {
    const user = userEvent.setup()
    setPassword.mockResolvedValue({})
    const pw = await renderReady()

    await user.type(pw, 'Correct-Horse1')
    await user.type(screen.getByLabelText(/confirm password/i), 'Correct-Horse1')
    await user.click(screen.getByRole('button', { name: /set password/i }))

    await waitFor(() => expect(takeFlash()).toBe('Password changed.'))
  })

  it('queues nothing when saving fails', async () => {
    const user = userEvent.setup()
    setPassword.mockRejectedValue(new Error('Password is too weak'))
    const pw = await renderReady()

    await user.type(pw, 'Correct-Horse1')
    await user.type(screen.getByLabelText(/confirm password/i), 'Correct-Horse1')
    await user.click(screen.getByRole('button', { name: /set password/i }))

    await screen.findByRole('alert')
    expect(takeFlash()).toBe(null)
  })

  it('surfaces a failure from Supabase and stays put', async () => {
    const user = userEvent.setup()
    setPassword.mockRejectedValue(new Error('Password is too weak'))
    const pw = await renderReady()

    await user.type(pw, 'Correct-Horse1')
    await user.type(screen.getByLabelText(/confirm password/i), 'Correct-Horse1')
    await user.click(screen.getByRole('button', { name: /set password/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/too weak/i)
    expect(replace).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /set password/i })).toBeEnabled()
  })
})
