import React, { useState } from 'react'
import { ACCENT } from '../../constants'

/**
 * Sends one member their invitation, holding its own progress state so the
 * Members tab does not need a spinner per row.
 *
 * Failures are shown in place rather than thrown away: "already has a login"
 * and "no such member" are both things a troop leader can act on, and the Edge
 * Function distinguishes them.
 */
export default function InviteButton({ member, onInvite }) {
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState(null)

  const send = async () => {
    setStatus('sending')
    setError(null)
    try {
      await onInvite(member)
      setStatus('sent')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <span
        role="status"
        style={{ fontSize: 12, color: ACCENT, fontWeight: 700, marginRight: 6 }}
      >
        ✓ Invite sent
      </span>
    )
  }

  return (
    <>
      {error && (
        <span
          role="alert"
          style={{ fontSize: 11, color: '#c62828', maxWidth: 190, marginRight: 6 }}
        >
          {error}
        </span>
      )}
      <button
        onClick={send}
        disabled={status === 'sending'}
        aria-label={`Invite ${member.full_name}`}
        style={{
          padding: '6px 12px',
          background: status === 'sending' ? '#eee' : '#fff8e1',
          color: status === 'sending' ? '#aaa' : '#e65100',
          border: 'none',
          borderRadius: 7,
          fontWeight: 600,
          cursor: status === 'sending' ? 'wait' : 'pointer',
          fontSize: 12,
          marginRight: 6,
        }}
      >
        {status === 'sending' ? 'Sending…' : '✉ Invite'}
      </button>
    </>
  )
}
