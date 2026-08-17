import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { members, QM, SCOUT, tent, openCheckout } from '../../test/fixtures'

// CheckInModal looks the requester's name up on mount. Without this mock the
// test issues a real network request — which, before .env.local existed,
// meant unit tests were querying the production database.
vi.mock('../../lib/members', () => ({
  getMemberById: vi.fn().mockResolvedValue({ full_name: 'Jordan Wong' }),
}))

import CheckInModal from './CheckInModal'

function renderModal(props = {}) {
  const onConfirm = vi.fn()
  render(
    <CheckInModal
      item={tent}
      openTransactions={[]}
      members={members}
      onClose={vi.fn()}
      onConfirm={onConfirm}
      {...props}
    />
  )
  return { onConfirm }
}

describe('CheckInModal — delivery mode (no open checkouts)', () => {
  it('will not submit until both people are chosen', async () => {
    renderModal()
    const confirm = screen.getByRole('button', { name: /receive/i })
    expect(confirm).toBeDisabled()
  })

  // REGRESSION: this modal sent `returnerId`/`checkerId` while handleCheckIn
  // destructured `returner`/`checker`. Both arrived undefined, which blew up on
  // log.requester_id (NOT NULL) and silently wrote NULL to the transaction.
  it('sends returner and checker under the keys the handler reads', async () => {
    const user = userEvent.setup()
    const { onConfirm } = renderModal()

    await user.selectOptions(screen.getByLabelText(/received by/i), QM.id)
    await user.selectOptions(screen.getByLabelText(/checked by/i), QM.id)
    await user.click(screen.getByRole('button', { name: /receive/i }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    const payload = onConfirm.mock.calls[0][0]
    expect(payload).toMatchObject({ returner: QM.id, checker: QM.id })
    expect(payload).not.toHaveProperty('returnerId')
    expect(payload).not.toHaveProperty('checkerId')
  })

  it('flags the submission as a pending delivery', async () => {
    const user = userEvent.setup()
    const { onConfirm } = renderModal()

    await user.selectOptions(screen.getByLabelText(/received by/i), QM.id)
    await user.selectOptions(screen.getByLabelText(/checked by/i), QM.id)
    await user.click(screen.getByRole('button', { name: /receive/i }))

    expect(onConfirm.mock.calls[0][0]).toMatchObject({
      isPendingDelivery: true,
      txId: null,
    })
  })
})

describe('CheckInModal — return mode (has open checkouts)', () => {
  const withOpen = { openTransactions: [openCheckout] }

  it('will not submit until both people are chosen', () => {
    renderModal(withOpen)
    expect(screen.getByRole('button', { name: /confirm return/i })).toBeDisabled()
  })

  // REGRESSION: same key mismatch, second code path.
  it('sends returner and checker under the keys the handler reads', async () => {
    const user = userEvent.setup()
    const { onConfirm } = renderModal(withOpen)

    await user.selectOptions(screen.getByLabelText(/returned by/i), SCOUT.id)
    await user.selectOptions(screen.getByLabelText(/checked by/i), QM.id)
    await user.click(screen.getByRole('button', { name: /confirm return/i }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    const payload = onConfirm.mock.calls[0][0]
    expect(payload).toMatchObject({ returner: SCOUT.id, checker: QM.id })
    expect(payload).not.toHaveProperty('returnerId')
    expect(payload).not.toHaveProperty('checkerId')
  })

  it('closes the selected transaction rather than a pending delivery', async () => {
    const user = userEvent.setup()
    const { onConfirm } = renderModal(withOpen)

    await user.selectOptions(screen.getByLabelText(/returned by/i), SCOUT.id)
    await user.selectOptions(screen.getByLabelText(/checked by/i), QM.id)
    await user.click(screen.getByRole('button', { name: /confirm return/i }))

    expect(onConfirm.mock.calls[0][0]).toMatchObject({
      isPendingDelivery: false,
      txId: openCheckout.id,
      qty: openCheckout.qty,
    })
  })
})
