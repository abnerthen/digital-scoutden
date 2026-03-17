import React, { useState } from 'react';
import { ACCENT, ACCENT2, attnBoxStyle, inputStyle, labelStyle, btnBase } from '../../constants';
import Overlay from '../elements/Overlay';

export default function BuyMoreModal({ item, onClose, onConfirm }) {
  const [qty, setQty] = useState(1);
  const [qtyDisplay, setQtyDisplay] = useState('1');
  const [receiveNow, setReceiveNow] = useState(true);
  const [notes, setNotes] = useState('');
  return (
    <Overlay>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: "'Playfair Display',serif",
            fontSize: 20,
            color: ACCENT,
          }}
        >
          🛒 Buy More: {item.name}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 22,
            cursor: 'pointer',
            color: '#888',
          }}
        >
          ✕
        </button>
      </div>
      <p
        style={{
          margin: '0 0 16px',
          color: '#777',
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        Records additional units being purchased. Total owned will increase.
        Optionally receive them into the storeroom now.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
        <div
          style={{
            flex: 1,
            background: '#f5f0e8',
            borderRadius: 8,
            padding: '8px 12px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Currently Owned
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "'Playfair Display',serif",
            }}
          >
            {item.total_owned} {item.unit}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: '#e8f5e9',
            borderRadius: 8,
            padding: '8px 12px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            After Purchase
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "'Playfair Display',serif",
              color: ACCENT,
            }}
          >
            {item.total_owned + qty} {item.unit}
          </div>
        </div>
      </div>

      <label style={labelStyle}>Units Being Purchased</label>
      <input
        type="number"
        min={1}
        value={qtyDisplay}
        onChange={(e) => {
          setQtyDisplay(e.target.value);
          const num = parseInt(e.target.value);
          if (!isNaN(num)) setQty(Math.max(1, num));
        }}
        onBlur={() => setQtyDisplay(String(qty))}
        style={inputStyle}
      />

      <div
        onClick={() => setReceiveNow((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginTop: 14,
          cursor: 'pointer',
          padding: '10px 14px',
          borderRadius: 8,
          background: receiveNow ? '#f0f7f0' : '#fafafa',
          border: `1.5px solid ${receiveNow ? '#c8e6c9' : '#e0e0e0'}`,
          transition: 'all 0.15s',
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            background: receiveNow ? ACCENT : '#ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {receiveNow && (
            <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>
              ✓
            </span>
          )}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, textAlign: "left" }}>
            Receive into storeroom now
          </div>
          <div style={{ fontSize: 12, color: '#777', textAlign: "left" }}>
            Uncheck if items are ordered but not yet delivered
          </div>
        </div>
      </div>

      <label style={labelStyle}>Notes</label>
      <textarea
        rows={2}
        placeholder="Supplier, order ref…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ ...inputStyle, resize: 'vertical' }}
      />

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button
          onClick={onClose}
          style={btnBase}
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm({ qty, receiveNow, notes })}
          style={{ ...btnBase, flex: 2, background: ACCENT, color: '#fff' }}
        >
          Confirm Purchase
        </button>
      </div>
    </Overlay>
  );
}