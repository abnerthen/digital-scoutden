import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toast from './Toast'

afterEach(() => {
  vi.useRealTimers()
})

describe('Toast', () => {
  it('renders nothing without a message', () => {
    const { container } = render(<Toast message={null} onDismiss={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  // role="status" is what gets the message announced to a screen reader.
  it('announces the message politely', () => {
    render(<Toast message="Password changed." onDismiss={vi.fn()} />)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Password changed.')
    expect(status).toHaveAttribute('aria-live', 'polite')
  })

  it('dismisses itself after the duration', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<Toast message="Password changed." onDismiss={onDismiss} duration={4000} />)

    expect(onDismiss).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(4000))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('can be dismissed by hand', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(<Toast message="Password changed." onDismiss={onDismiss} />)

    await user.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not start a timer when there is no message', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<Toast message={null} onDismiss={onDismiss} />)

    act(() => vi.advanceTimersByTime(10000))
    expect(onDismiss).not.toHaveBeenCalled()
  })
})
