// Wiring tests for App's modal dispatch.
//
// REGRESSION: the inventory card set `{ type: 'buymore' }` while the render
// checked `'buyMore'`, so the Buy More modal could never open — a whole
// feature was dead and nothing failed loudly. These tests open every modal
// from the inventory card so a typo in a modal type string cannot hide again.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  items, members, categories, locations, groups, openCheckout,
} from './test/fixtures'

vi.mock('./lib/items', () => ({
  getItems: vi.fn(),
  addItem: vi.fn(),
  updateItemQuantity: vi.fn(),
  archiveItem: vi.fn(),
  uploadItemImage: vi.fn(),
  updateItem: vi.fn(),
}))
vi.mock('./lib/groups', () => ({ getGroups: vi.fn(), saveGroup: vi.fn() }))
vi.mock('./lib/log', () => ({ getLog: vi.fn(), writeLog: vi.fn() }))
vi.mock('./lib/auth', () => ({ signOut: vi.fn() }))
vi.mock('./lib/transactions', () => ({
  getOpenTransactions: vi.fn(), createCheckout: vi.fn(), closeTransaction: vi.fn(),
}))
vi.mock('./lib/members', () => ({
  getMembers: vi.fn(), addMember: vi.fn(), deactivateMember: vi.fn(),
  updateMember: vi.fn(), restoreMember: vi.fn(), getInactiveMembers: vi.fn(),
}))
vi.mock('./lib/categories', () => ({
  getCategories: vi.fn(), addCategory: vi.fn(), deleteCategory: vi.fn(),
}))
vi.mock('./lib/locations', () => ({
  getLocations: vi.fn(), addLocation: vi.fn(), deleteLocation: vi.fn(),
}))

import App from './App'
import { getItems } from './lib/items'
import { getGroups } from './lib/groups'
import { getLog } from './lib/log'
import { getOpenTransactions } from './lib/transactions'
import { getMembers, getInactiveMembers } from './lib/members'
import { getCategories } from './lib/categories'
import { getLocations } from './lib/locations'

beforeEach(() => {
  vi.clearAllMocks()
  getItems.mockResolvedValue(items)
  getGroups.mockResolvedValue(groups)
  getLog.mockResolvedValue([])
  getOpenTransactions.mockResolvedValue([openCheckout])
  getMembers.mockResolvedValue(members)
  getInactiveMembers.mockResolvedValue([])
  getCategories.mockResolvedValue(categories)
  getLocations.mockResolvedValue(locations)
})

async function renderApp() {
  render(<App />)
  // wait past the loading state
  expect(await screen.findByText('4-Man Tent')).toBeInTheDocument()
}

describe('inventory card opens the right modal', () => {
  it('opens Buy More', async () => {
    const user = userEvent.setup()
    await renderApp()
    await user.click(screen.getAllByTitle(/buy more units/i)[0])
    expect(await screen.findByText(/buy more: 4-man tent/i)).toBeInTheDocument()
  })

  it('opens Write Off', async () => {
    const user = userEvent.setup()
    await renderApp()
    await user.click(screen.getAllByTitle(/write off/i)[0])
    expect(await screen.findByText(/write off units/i)).toBeInTheDocument()
  })

  it('opens Archive Item', async () => {
    const user = userEvent.setup()
    await renderApp()
    await user.click(screen.getAllByTitle(/archive entire item/i)[0])
    // heading, not the button — both read "Archive Item"
    expect(await screen.findByRole('heading', { name: /archive item/i })).toBeInTheDocument()
  })

  it('opens Item Details', async () => {
    const user = userEvent.setup()
    await renderApp()
    await user.click(screen.getAllByTitle(/view item details/i)[0])
    expect(await screen.findByText(/item details/i)).toBeInTheDocument()
  })

  it('opens Check Out', async () => {
    const user = userEvent.setup()
    await renderApp()
    await user.click(screen.getAllByRole('button', { name: /▼ out/i })[0])
    expect(await screen.findByRole('button', { name: /confirm check out/i })).toBeInTheDocument()
  })
})

describe('inventory rendering', () => {
  it('hides archived items by default', async () => {
    await renderApp()
    expect(screen.queryByText('Kerosene Lamp')).not.toBeInTheDocument()
  })

  it('shows each item its storeroom location', async () => {
    await renderApp()
    expect(screen.getByText(/Shelf A — Tentage/)).toBeInTheDocument()
  })

  it('warns about low stock', async () => {
    await renderApp()
    expect(screen.getByText(/low stock:/i)).toBeInTheDocument()
  })
})

describe('tabs', () => {
  it('has a Locations tab that lists locations', async () => {
    const user = userEvent.setup()
    await renderApp()
    await user.click(screen.getByRole('button', { name: /locations/i }))
    expect(await screen.findByText(/storeroom locations/i)).toBeInTheDocument()
    // the name appears twice: once in the layout editor, once in the list
    expect(screen.getAllByText(/Shelf B — Cooking/).length).toBeGreaterThan(0)
  })

  it('offers a draggable layout editor on the Locations tab', async () => {
    const user = userEvent.setup()
    await renderApp()
    await user.click(screen.getByRole('button', { name: /locations/i }))
    expect(await screen.findByRole('button', { name: /Shelf A.*column 1 row 1/i }))
      .toBeInTheDocument()
  })

  it('has a Categories tab', async () => {
    const user = userEvent.setup()
    await renderApp()
    await user.click(screen.getByRole('button', { name: /categories/i }))
    expect(await screen.findByPlaceholderText(/new category name/i)).toBeInTheDocument()
  })

  // REGRESSION: App never passed `newCategory` back to CategoriesTab, so its
  // controlled input was pinned to the default '' and typing did nothing —
  // you could not add a category at all.
  it('lets you type a new category name', async () => {
    const user = userEvent.setup()
    await renderApp()
    await user.click(screen.getByRole('button', { name: /categories/i }))
    const input = await screen.findByPlaceholderText(/new category name/i)
    await user.type(input, 'Ropes')
    expect(input).toHaveValue('Ropes')
  })

  it('lets you type a new location name', async () => {
    const user = userEvent.setup()
    await renderApp()
    await user.click(screen.getByRole('button', { name: /locations/i }))
    const input = await screen.findByPlaceholderText(/shelf c/i)
    await user.type(input, 'Shelf D')
    expect(input).toHaveValue('Shelf D')
  })
})
