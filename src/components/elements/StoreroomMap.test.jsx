import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StoreroomMap from './StoreroomMap'
import { gridRows } from '../../lib/selectors'
import { locations } from '../../test/fixtures'

describe('gridRows', () => {
  it('is zero when there is nothing to place', () => {
    expect(gridRows([])).toBe(0)
  })

  it('counts the bottom edge of the lowest section', () => {
    expect(gridRows(locations)).toBe(1)
  })

  it('accounts for a section that spans several rows', () => {
    const tall = [{ id: 'x', name: 'Cage', grid_x: 0, grid_y: 1, grid_w: 1, grid_h: 3 }]
    expect(gridRows(tall)).toBe(4)
  })

  // A new location is parked at gridRows(existing), so this must never
  // return a row that something already occupies.
  it('returns a row below everything placed so far', () => {
    const next = gridRows(locations)
    const collides = locations.some(
      l => next >= l.grid_y && next < l.grid_y + l.grid_h
    )
    expect(collides).toBe(false)
  })

  it('treats missing dimensions as a single cell', () => {
    expect(gridRows([{ id: 'x', name: 'Bare' }])).toBe(1)
  })
})

describe('StoreroomMap', () => {
  it('says so when no locations are defined', () => {
    render(<StoreroomMap locations={[]} />)
    expect(screen.getByText(/no locations defined yet/i)).toBeInTheDocument()
  })

  it('draws every location', () => {
    render(<StoreroomMap locations={locations} />)
    expect(screen.getByText(/Shelf A/)).toBeInTheDocument()
    expect(screen.getByText(/Shelf B/)).toBeInTheDocument()
  })

  it('names the highlighted section for screen readers', () => {
    render(<StoreroomMap locations={locations} highlightId={locations[0].id} />)
    expect(screen.getByRole('img')).toHaveAccessibleName(/Shelf A/)
  })

  it('is still labelled when nothing is highlighted', () => {
    render(<StoreroomMap locations={locations} />)
    expect(screen.getByRole('img')).toHaveAccessibleName('Storeroom map')
  })

  it('renders a caption when given one', () => {
    render(<StoreroomMap locations={locations} caption="Kept in Shelf A." />)
    expect(screen.getByText('Kept in Shelf A.')).toBeInTheDocument()
  })

  it('does not fall over on a location with no grid values', () => {
    expect(() =>
      render(<StoreroomMap locations={[{ id: 'x', name: 'Bare' }]} />)
    ).not.toThrow()
  })

  // Geometry, so the layout maths cannot drift unnoticed. CELL=48, GAP=4,
  // 6 columns wide.
  it('sizes the canvas to six columns and the rows in use', () => {
    const { container } = render(<StoreroomMap locations={locations} />)
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 288 48')
  })

  it('places each section at its grid coordinates', () => {
    const { container } = render(<StoreroomMap locations={locations} />)
    // index 0 is the room outline, so section rects start at 1
    const rects = [...container.querySelectorAll('rect')].slice(1)

    // Shelf A at x0 y0, 2 cells wide: 0*48+4=4, 2*48-8=88
    expect(rects[0]).toHaveAttribute('x', '4')
    expect(rects[0]).toHaveAttribute('width', '88')
    expect(rects[0]).toHaveAttribute('height', '40')

    // Shelf B at x2: 2*48+4=100
    expect(rects[1]).toHaveAttribute('x', '100')
  })

  it('gives a taller section proportionally more height', () => {
    const tall = [{ id: 'x', name: 'Cage', grid_x: 0, grid_y: 0, grid_w: 1, grid_h: 2 }]
    const { container } = render(<StoreroomMap locations={tall} />)
    const rect = [...container.querySelectorAll('rect')][1]
    // 2*48-8 = 88
    expect(rect).toHaveAttribute('height', '88')
  })
})
