import React, { useState } from 'react';
import { labelStyle, inputStyle, btnBase, modalTitleStyle, attnBoxStyle } from '../../constants';
// import { getItems, addItem, updateItemQuantity, archiveItem, uploadItemImage, updateItem } from '../../lib/items';

import Overlay from '../elements/Overlay';
import MemberSelect from '../elements/MemberSelect';

// ─── Remove Item Modal ─────────────────────────────────────────────────────────
export default function RemoveItemModal({ item, members = [], onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [checkerId, setCheckerId] = useState('');
  return (
    <Overlay>
      <h2
        style={{...modalTitleStyle,
          margin: '0 0 8px',
          color: '#c62828',
        }}
      >
        🗑️ Archive Item
      </h2>
      <p
        style={{
          color: '#555',
          marginBottom: 16,
          lineHeight: 1.5,
          fontSize: 14,
        }}
      >
        <strong>{item.name}</strong> will be archived. All past log entries are
        preserved.
      </p>
      <label style={labelStyle}>Reason</label>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        style={inputStyle}
      >
        <option value="">Select a reason…</option>
        <option>Lost</option>
        <option>Damaged beyond repair</option>
        <option>Disposed / Written off</option>
        <option>Transferred to another troop</option>
        <option>Other</option>
      </select>
      <MemberSelect
        value={checkerId}
        onChange={setCheckerId}
        members={members.filter((m) => ['quartermaster', 'assistant_qm'].includes(m.role))}
        label="Archived by (QM on duty)"
      />
      <div
        style={{
          ...attnBoxStyle,
          margin: '14px 0',
        }}
      >
        ⚠️ This removes the item from active inventory. Log history is kept.
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onClose}
          style={btnBase}
        >
          Cancel
        </button>
        <button
          disabled={!reason || !checkerId}
          onClick={() => onConfirm(reason, checkerId)}
          style={{
            ...btnBase,
            flex: 2,
            background: reason && checkerId ? '#c62828' : '#eee',
            color: reason && checkerId ? '#fff' : '#aaa',
            cursor: reason && checkerId ? 'pointer' : 'not-allowed',
          }}
        >
          Archive Item
        </button>
      </div>
    </Overlay>
  );
}