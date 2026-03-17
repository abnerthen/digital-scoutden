import React, { useState } from 'react';
import { DARK, ACCENT, btnBase, modalTitleStyle } from '../../constants';
import Overlay from '../elements/Overlay';
import { CloseButton } from '../elements/buttons';

// ─── Group Detail Modal ────────────────────────────────────────────────────────
export default function GroupDetailModal({ group, onClose, onEdit }) {
  const outstanding = group.checkouts || [];
  const members = group.members || group.group_members || []  // add fallback
  const totalUnits = outstanding.reduce((a, c) => a + c.qty, 0);

  return (
    <Overlay wide>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div>
          <h2
            style={modalTitleStyle}
          >
            {group.name}
          </h2>
          <span style={{ fontSize: 12, color: '#888' }}>
            {group.type === 'led' ? '👑 Led Group' : '🤝 Collective Group'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onEdit}
            style={{
              ...btnBase,
              padding: '10px 16px',
              background: ACCENT,
              color: '#fff',
            }}
          >
            ✎ Edit
          </button>
          <CloseButton onClick={onClose} />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: '#f5f0e8',
            borderRadius: 10,
            padding: '12px 16px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: '#888',
              fontWeight: 700,
            }}
          >
            Members
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              fontFamily: "'Playfair Display',serif",
            }}
          >
            {members.length}
          </div>
        </div>
        <div
          style={{
            background: outstanding.length > 0 ? '#fff3e0' : '#f5f0e8',
            borderRadius: 10,
            padding: '12px 16px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: '#888',
              fontWeight: 700,
            }}
          >
            Items Out
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              fontFamily: "'Playfair Display',serif",
              color: outstanding.length > 0 ? '#e65100' : DARK,
            }}
          >
            {outstanding.length} types · {totalUnits} units
          </div>
        </div>
      </div>

      <h4
        style={{
          margin: '0 0 8px',
          fontFamily: "'Playfair Display',serif",
          fontSize: 15,
        }}
      >
        Members
      </h4>
      <div
        style={{
          border: '1px solid #e8e0d4',
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        {members.length === 0 ? (
          <p
            style={{
              padding: '12px 16px',
              color: '#bbb',
              fontStyle: 'italic',
              margin: 0,
            }}
          >
            No members.
          </p>
        ) : (
          members.map((m, i) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: m.is_leader ? '#03890f' : '#fff',
                padding: '10px 14px',
                borderBottom:
                  i < members.length - 1 ? '1px solid #f0ece4' : 'none',
              }}
            >
              <span>{group.type === 'led' && m.is_leader ? '👑' : '🧑'}</span>
              <span style={{ flex: 1 }}>{m.name}</span>
              {group.type === 'led' && m.is_leaders && (
                <span
                  style={{
                    fontSize: 11,
                    background: '#c8e6c9',
                    color: ACCENT,
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontWeight: 700,
                  }}
                >
                  Leader
                </span>
              )}
              {group.type === 'collective' && (
                <span
                  style={{
                    fontSize: 11,
                    background: '#e3f2fd',
                    color: '#1565c0',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontWeight: 700,
                  }}
                >
                  Responsible
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <h4
        style={{
          margin: '0 0 8px',
          fontFamily: "'Playfair Display',serif",
          fontSize: 15,
        }}
      >
        Outstanding Checkouts
      </h4>
      {outstanding.length === 0 ? (
        <p style={{ color: '#bbb', fontStyle: 'italic', fontSize: 13 }}>
          No items currently checked out.
        </p>
      ) : (
        <div
          style={{
            border: '1px solid #ffe0b2',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {outstanding.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderBottom:
                  i < outstanding.length - 1 ? '1px solid #fff3e0' : 'none',
                background: '#fffbf7',
              }}
            >
              <span style={{ fontSize: 20 }}>📦</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{c.itemName}</div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  Checked out {new Date(c.date).toLocaleDateString()}
                  {c.event ? ` · ${c.event}` : ''}
                </div>
              </div>
              <span style={{ fontWeight: 700, color: '#e65100' }}>
                {c.qty} {c.unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </Overlay>
  );
}