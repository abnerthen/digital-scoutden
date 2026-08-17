// Contract tests: every modal must hand its parent exactly the keys that
// parent destructures. Four of the bugs found on 2026-08-17 were mismatches
// at precisely this boundary, and none were visible to a mocked-Supabase test.

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import CheckOutModal from './CheckOutModal'
import WriteOffModal from './WriteOffModal'
import BuyMoreModal from './BuyMoreModal'
import RemoveItemModal from './RemoveItemModal'
import AddItemModal from './AddItemModal'

import { members, QM, SCOUT, tent, groups, categories, locations } from '../../test/fixtures'

describe('CheckOutModal', () => {
  const setup = () => {
    const onConfirm = vi.fn()
    render(
      <CheckOutModal item={tent} groups={groups} members={members}
        onClose={vi.fn()} onConfirm={onConfirm} />
    )
    return { onConfirm }
  }

  it('will not submit without a requester and a checker', () => {
    setup()
    expect(screen.getByRole('button', { name: /confirm check out/i })).toBeDisabled()
  })

  it('sends requester and checker under the keys handleCheckOut reads', async () => {
    const user = userEvent.setup()
    const { onConfirm } = setup()

    await user.selectOptions(screen.getByLabelText(/requested by/i), SCOUT.id)
    await user.selectOptions(screen.getByLabelText(/checked by/i), QM.id)
    await user.click(screen.getByRole('button', { name: /confirm check out/i }))

    const payload = onConfirm.mock.calls[0][0]
    expect(payload).toMatchObject({ requester: SCOUT.id, checker: QM.id })
    expect(payload).not.toHaveProperty('requesterId')
  })
})

describe('WriteOffModal', () => {
  const setup = (props = {}) => {
    const onConfirm = vi.fn()
    render(
      <WriteOffModal item={tent} members={members}
        onClose={vi.fn()} onConfirm={onConfirm} {...props} />
    )
    return { onConfirm }
  }

  // REGRESSION: `members` was used inside the component but never declared as a
  // prop and never passed by App, so opening this modal threw a ReferenceError
  // and blanked the screen.
  it('renders when members is omitted entirely', () => {
    expect(() =>
      render(<WriteOffModal item={tent} onClose={vi.fn()} onConfirm={vi.fn()} />)
    ).not.toThrow()
  })

  // REGRESSION: the checker was collected but never required, and never sent —
  // producing a NOT NULL violation on log.requester_id.
  it('will not submit without a reason and a checker', async () => {
    const user = userEvent.setup()
    setup()
    const confirm = screen.getByRole('button', { name: /write off/i })
    expect(confirm).toBeDisabled()

    await user.selectOptions(screen.getAllByRole('combobox')[0], 'Lost at activity')
    expect(confirm).toBeDisabled() // reason alone is not enough
  })

  it('sends the chosen checker with the payload', async () => {
    const user = userEvent.setup()
    const { onConfirm } = setup()

    await user.selectOptions(screen.getAllByRole('combobox')[0], 'Lost at activity')
    await user.selectOptions(screen.getByLabelText(/write off by/i), QM.id)
    await user.click(screen.getByRole('button', { name: /write off/i }))

    expect(onConfirm.mock.calls[0][0]).toMatchObject({
      reason: 'Lost at activity', checker: QM.id,
    })
  })
})

describe('BuyMoreModal', () => {
  const setup = () => {
    const onConfirm = vi.fn()
    render(
      <BuyMoreModal item={tent} members={members}
        onClose={vi.fn()} onConfirm={onConfirm} />
    )
    return { onConfirm }
  }

  // REGRESSION: this modal collected no member at all, so every purchase hit
  // the NOT NULL constraint on log.requester_id.
  it('will not submit without a checker', () => {
    setup()
    expect(screen.getByRole('button', { name: /confirm purchase/i })).toBeDisabled()
  })

  it('sends the chosen checker with the payload', async () => {
    const user = userEvent.setup()
    const { onConfirm } = setup()

    await user.selectOptions(screen.getByLabelText(/purchased by/i), QM.id)
    await user.click(screen.getByRole('button', { name: /confirm purchase/i }))

    expect(onConfirm.mock.calls[0][0]).toMatchObject({
      checker: QM.id, receiveNow: true, qty: 1,
    })
  })
})

describe('RemoveItemModal', () => {
  const setup = () => {
    const onConfirm = vi.fn()
    render(
      <RemoveItemModal item={tent} members={members}
        onClose={vi.fn()} onConfirm={onConfirm} />
    )
    return { onConfirm }
  }

  // REGRESSION: archiving collected no member, hitting the same NOT NULL wall.
  it('will not submit without both a reason and a checker', async () => {
    const user = userEvent.setup()
    setup()
    const confirm = screen.getByRole('button', { name: /archive item/i })
    expect(confirm).toBeDisabled()

    await user.selectOptions(screen.getAllByRole('combobox')[0], 'Lost')
    expect(confirm).toBeDisabled()
  })

  it('passes reason and checker positionally, as App wires them', async () => {
    const user = userEvent.setup()
    const { onConfirm } = setup()

    await user.selectOptions(screen.getAllByRole('combobox')[0], 'Lost')
    await user.selectOptions(screen.getByLabelText(/archived by/i), QM.id)
    await user.click(screen.getByRole('button', { name: /archive item/i }))

    expect(onConfirm).toHaveBeenCalledWith('Lost', QM.id)
  })
})

describe('AddItemModal', () => {
  const setup = () => {
    const onAdd = vi.fn()
    render(
      <AddItemModal categories={categories} locations={locations} members={members}
        onClose={vi.fn()} onAdd={onAdd} />
    )
    return { onAdd }
  }

  it('will not submit without a name and a checker', async () => {
    const user = userEvent.setup()
    setup()
    const confirm = screen.getByRole('button', { name: /record purchase/i })
    expect(confirm).toBeDisabled()

    await user.type(screen.getByPlaceholderText(/rope/i), 'Mallet')
    expect(confirm).toBeDisabled() // name alone is not enough
  })

  it('sends categoryId, locationId and checkerId', async () => {
    const user = userEvent.setup()
    const { onAdd } = setup()

    await user.type(screen.getByPlaceholderText(/rope/i), 'Mallet')
    await user.selectOptions(screen.getByLabelText(/checked by/i), QM.id)
    await user.click(screen.getByRole('button', { name: /record purchase/i }))

    expect(onAdd.mock.calls[0][0]).toMatchObject({
      name: 'Mallet',
      categoryId: categories[0].id,
      checkerId: QM.id,
    })
  })

  it('defaults location to unassigned, which App maps to null', async () => {
    const user = userEvent.setup()
    const { onAdd } = setup()

    await user.type(screen.getByPlaceholderText(/rope/i), 'Mallet')
    await user.selectOptions(screen.getByLabelText(/checked by/i), QM.id)
    await user.click(screen.getByRole('button', { name: /record purchase/i }))

    expect(onAdd.mock.calls[0][0].locationId).toBe('')
  })
})
