import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setFlash, takeFlash } from './flash'

beforeEach(() => {
  sessionStorage.clear()
})

describe('flash messages', () => {
  it('returns null when nothing is queued', () => {
    expect(takeFlash()).toBe(null)
  })

  it('carries a message across a read', () => {
    setFlash('Password changed.')
    expect(takeFlash()).toBe('Password changed.')
  })

  // Otherwise refreshing the page would show the confirmation again.
  it('clears the message once read', () => {
    setFlash('Password changed.')
    takeFlash()
    expect(takeFlash()).toBe(null)
  })

  describe('when storage is unavailable', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    // Safari private browsing throws on write. A missing confirmation must
    // never break the navigation that follows it.
    it('swallows a write failure', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      expect(() => setFlash('Password changed.')).not.toThrow()
    })

    it('returns null on a read failure', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })
      expect(takeFlash()).toBe(null)
    })
  })
})
