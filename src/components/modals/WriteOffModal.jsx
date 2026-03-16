import React, { useState } from 'react';
import Overlay from '../Overlay';
import { labelStyle, inputStyle, btnBase, ACCENT, DARK, modalTitleStyle } from '../../constants';

export default function WriteOffModal({ item, onClose, onConfirm }) {
  const unitsOut = item.total_owned - item.quantity;
  const maxWriteOff = item.quantity;
  const [qty, setQty] = useState(1);
  const [qtyDisplay, setQtyDisplay] = useState("1");
  const [reason, setReason] = useState("");

  return (
    <Overlay>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ ...modalTitleStyle, color: "#c62828" }}>✕ Write Off Units</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>✕</button>
      </div>

      <p style={{ color: "#555", marginBottom: 16, lineHeight: 1.5, fontSize: 14 }}>
        Permanently reduce stock of <strong>{item.name}</strong>. Only units currently in store can be written off.
        {unitsOut > 0 && <> <strong>{unitsOut}</strong> {item.unit} are currently checked out and cannot be written off until returned.</>}
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: "#f5f0e8", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>In Store</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif", color: ACCENT }}>{item.quantity}</div>
        </div>
        <div style={{ flex: 1, background: "#fff3e0", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>Out with Scouts</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif", color: unitsOut > 0 ? "#e65100" : DARK }}>{unitsOut}</div>
        </div>
        <div style={{ flex: 1, background: "#f5f0e8", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>Total Owned</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{item.total_owned}</div>
        </div>
      </div>

      <label style={labelStyle}>Units to write off (max {maxWriteOff})</label>
      <input
        type="number"
        min={1}
        max={maxWriteOff}
        value={qtyDisplay}
        onChange={e => {
          setQtyDisplay(e.target.value);
          const n = parseInt(e.target.value);
          if (!isNaN(n)) setQty(Math.max(1, Math.min(maxWriteOff, n)));
        }}
        onBlur={() => setQtyDisplay(String(qty))}
        style={inputStyle}
        disabled={maxWriteOff === 0}
      />

      <label style={labelStyle}>Reason</label>
      <select value={reason} onChange={e => setReason(e.target.value)} style={inputStyle} disabled={maxWriteOff === 0}>
        <option value="">Select a reason…</option>
        <option>Damaged / broken</option>
        <option>Lost at activity</option>
        <option>Worn out / end of life</option>
        <option>Stolen</option>
        <option>Other</option>
      </select>

      <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, padding: "10px 14px", margin: "14px 0", fontSize: 13, color: "#7a5800" }}>
        {maxWriteOff === 0
          ? "⚠️ All units are currently checked out. Ask scouts to return items before writing off."
          : <>⚠️ In-store stock will go from <strong>{item.quantity}</strong> → <strong>{item.quantity - qty}</strong>. Total owned from <strong>{item.total_owned}</strong> → <strong>{item.total_owned - qty}</strong>. This cannot be undone.</>
        }
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ ...btnBase, flex: 1, background: "#eee", color: "#555" }}>Cancel</button>
        <button
          disabled={!reason || maxWriteOff === 0}
          onClick={() => onConfirm({ qty, reason })}
          style={{ ...btnBase, flex: 2, background: reason && maxWriteOff > 0 ? "#c62828" : "#eee", color: reason && maxWriteOff > 0 ? "#fff" : "#aaa", cursor: reason && maxWriteOff > 0 ? "pointer" : "not-allowed" }}>
          {maxWriteOff === 0 ? "Nothing in store to write off" : `Write Off ${qty} ${item.unit}`}
        </button>
      </div>
    </Overlay>
  );
}