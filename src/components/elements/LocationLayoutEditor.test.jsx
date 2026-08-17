import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LocationLayoutEditor from './LocationLayoutEditor'
import {
  rectsOverlap, clampToGrid, canPlaceSection, sectionRect, GRID_COLUMNS,
} from '../../lib/selectors'
import { locations } from '../../test/fixtures'

describe('rectsOverlap', () => {
  const a = { x: 0, y: 0, w: 2, h: 2 }

  it('detects a shared cell', () => {
    expect(rectsOverlap(a, { x: 1, y: 1, w: 2, h: 2 })).toBe(true)
  })

  it('treats touching edges as clear', () => {
    expect(rectsOverlap(a, { x: 2, y: 0, w: 2, h: 2 })).toBe(false)
    expect(rectsOverlap(a, { x: 0, y: 2, w: 2, h: 2 })).toBe(false)
  })

  it('detects full containment', () => {
    expect(rectsOverlap(a, { x: 0, y: 0, w: 1, h: 1 })).toBe(true)
  })
})

describe('clampToGrid', () => {
  it('pulls a section back inside the left and top edges', () => {
    expect(clampToGrid({ x: -3, y: -2, w: 1, h: 1 })).toMatchObject({ x: 0, y: 0 })
  })

  it('stops a section running past the right-hand column', () => {
    const r = clampToGrid({ x: 5, y: 0, w: 3, h: 1 })
    expect(r.x + r.w).toBeLessThanOrEqual(GRID_COLUMNS)
  })

  it('never allows a zero or negative span', () => {
    expect(clampToGrid({ x: 0, y: 0, w: 0, h: -4 })).toMatchObject({ w: 1, h: 1 })
  })

  it('leaves a section that already fits untouched', () => {
    const r = { x: 1, y: 2, w: 2, h: 1 }
    expect(clampToGrid(r)).toEqual(r)
  })
})

describe('canPlaceSection', () => {
  it('refuses a placement that lands on another section', () => {
    // Shelf B occupies x2..x3 on row 0
    expect(canPlaceSection({ x: 2, y: 0, w: 1, h: 1 }, locations, 'other')).toBe(false)
  })

  it('allows a section to stay where it already is', () => {
    const shelfA = locations[0]
    expect(canPlaceSection(sectionRect(shelfA), locations, shelfA.id)).toBe(true)
  })

  it('allows an empty row below everything', () => {
    expect(canPlaceSection({ x: 0, y: 5, w: 1, h: 1 }, locations, 'new')).toBe(true)
  })

  it('refuses a placement that leaves the grid', () => {
    expect(canPlaceSection({ x: -1, y: 0, w: 1, h: 1 }, locations, 'new')).toBe(false)
    expect(canPlaceSection({ x: 5, y: 3, w: 3, h: 1 }, locations, 'new')).toBe(false)
  })
})

describe('LocationLayoutEditor', () => {
  const setup = () => {
    const onUpdateLocation = vi.fn()
    render(<LocationLayoutEditor locations={locations} onUpdateLocation={onUpdateLocation} />)
    return { onUpdateLocation }
  }

  it('prompts to add a location when there are none', () => {
    render(<LocationLayoutEditor locations={[]} onUpdateLocation={vi.fn()} />)
    expect(screen.getByText(/add a location below/i)).toBeInTheDocument()
  })

  it('exposes each section as a focusable control describing its position', () => {
    setup()
    expect(screen.getByRole('button', { name: /Shelf A.*column 1 row 1, 2 by 1/i }))
      .toBeInTheDocument()
  })

  // Keyboard support is what keeps this usable without a mouse.
  it('moves a section down with the arrow keys', async () => {
    const user = userEvent.setup()
    const { onUpdateLocation } = setup()

    await user.tab() // focus the first section
    await user.keyboard('{ArrowDown}')

    expect(onUpdateLocation).toHaveBeenCalledWith(
      locations[0].id,
      expect.objectContaining({ grid_x: 0, grid_y: 1 })
    )
  })

  it('resizes with shift and an arrow key', async () => {
    const user = userEvent.setup()
    const { onUpdateLocation } = setup()

    await user.tab()
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')

    expect(onUpdateLocation).toHaveBeenCalledWith(
      locations[0].id,
      expect.objectContaining({ grid_h: 2 })
    )
  })

  it('refuses a keyboard move onto an occupied cell', async () => {
    const user = userEvent.setup()
    const { onUpdateLocation } = setup()

    // Shelf A is at x0 w2; moving right would run into Shelf B at x2
    await user.tab()
    await user.keyboard('{ArrowRight}')

    expect(onUpdateLocation).not.toHaveBeenCalled()
  })

  it('refuses a keyboard move off the left edge', async () => {
    const user = userEvent.setup()
    const { onUpdateLocation } = setup()

    await user.tab()
    await user.keyboard('{ArrowLeft}')

    expect(onUpdateLocation).not.toHaveBeenCalled()
  })

  it('ignores keys that are not arrows', async () => {
    const user = userEvent.setup()
    const { onUpdateLocation } = setup()

    await user.tab()
    await user.keyboard('a')

    expect(onUpdateLocation).not.toHaveBeenCalled()
  })
})
