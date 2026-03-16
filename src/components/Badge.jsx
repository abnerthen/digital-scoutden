import React from 'react';

export default function Badge({ type }) {
  const map = {
    IN: { bg: '#e8f5e9', color: '#2e7d32', label: '▲ IN' },
    OUT: { bg: '#fff3e0', color: '#e65100', label: '▼ OUT' },
    ADD: { bg: '#e3f2fd', color: '#1565c0', label: '+ NEW' },
    WRITEOFF: { bg: '#fce4ec', color: '#c62828', label: '✕ WRITE-OFF' },
    DELETE: { bg: '#f3e5f5', color: '#6a1b9a', label: '✕ ARCHIVED' },
  };
  const s = map[type] || map.ADD;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: 6,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'monospace',
        letterSpacing: 1,
      }}
    >
      {s.label}
    </span>
  );
}