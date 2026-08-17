import React, { useEffect } from 'react'
import { ACCENT } from '../../constants'

/**
 * Transient confirmation bubble, pinned to the bottom of the screen.
 *
 * role="status" with aria-live="polite" so it is announced to a screen reader
 * without interrupting whatever is being read.
 */
export default function Toast({ message, onDismiss, duration = 4000 }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [message, onDismiss, duration])

  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 28,
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: ACCENT,
        color: '#fff',
        padding: '11px 16px',
        borderRadius: 999,
        boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
        fontSize: 14,
        fontWeight: 600,
        zIndex: 1000,
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <span aria-hidden="true">✓</span>
      <span>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          fontSize: 18,
          lineHeight: 1,
          cursor: 'pointer',
          padding: '0 0 0 4px',
          opacity: 0.8,
        }}
      >
        ×
      </button>
    </div>
  )
}
