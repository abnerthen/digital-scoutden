import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InviteButton from './InviteButton'
import { SCOUT } from '../../test/fixtures'

describe('InviteButton', () => {
  it('sends the invitation for its own member', async () => {
    const user = userEvent.setup()
    const onInvite = vi.fn().mockResolvedValue({})
    render(<InviteButton member={SCOUT} onInvite={onInvite} />)

    await user.click(screen.getByRole('button', { name: /invite jordan wong/i }))
    expect(onInvite).toHaveBeenCalledWith(SCOUT)
  })

  it('confirms once the invitation is away', async () => {
    const user = userEvent.setup()
    render(<InviteButton member={SCOUT} onInvite={vi.fn().mockResolvedValue({})} />)

    await user.click(screen.getByRole('button', { name: /invite/i }))
    expect(await screen.findByRole('status')).toHaveTextContent(/invite sent/i)
    expect(screen.queryByRole('button', { name: /invite/i })).not.toBeInTheDocument()
  })

  // "already has a login" and "no such member" are both actionable; throwing
  // them away would leave a leader clicking a button that silently does nothing.
  it('shows why an invitation was refused', async () => {
    const user = userEvent.setup()
    const onInvite = vi.fn().mockRejectedValue(new Error('Jordan Wong already has a login.'))
    render(<InviteButton member={SCOUT} onInvite={onInvite} />)

    await user.click(screen.getByRole('button', { name: /invite/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/already has a login/i)
  })

  it('allows another attempt after a failure', async () => {
    const user = userEvent.setup()
    const onInvite = vi.fn()
      .mockRejectedValueOnce(new Error('Network unreachable'))
      .mockResolvedValueOnce({})
    render(<InviteButton member={SCOUT} onInvite={onInvite} />)

    await user.click(screen.getByRole('button', { name: /invite/i }))
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: /invite/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/invite sent/i)
    expect(onInvite).toHaveBeenCalledTimes(2)
  })

  it('cannot be double-sent while in flight', async () => {
    const user = userEvent.setup()
    const onInvite = vi.fn(() => new Promise(() => {})) // never settles
    render(<InviteButton member={SCOUT} onInvite={onInvite} />)

    const button = screen.getByRole('button', { name: /invite/i })
    await user.click(button)
    expect(button).toBeDisabled()
    expect(onInvite).toHaveBeenCalledTimes(1)
  })
})
