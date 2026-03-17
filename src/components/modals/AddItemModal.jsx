import React, { useState, useRef } from 'react';
import { ACCENT, labelStyle, inputStyle, btnBase, modalTitleStyle } from '../../constants';
import { closeButton as CloseButton } from '../elements/buttons';

import Overlay from '../Overlay';

// ─── Add Item Modal (new purchase) ────────────────────────────────────────────
export default function AddItemModal({ onClose, onAdd, categories }) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [qtyDisplay, setQtyDisplay] = useState('1');
  const [unit, setUnit] = useState('units');
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

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
          style={modalTitleStyle}
        >
          🛒 New Purchase
        </h2>
        <CloseButton onClick={onClose} />
      </div>
      <p
        style={{
          margin: '0 0 16px',
          color: '#777',
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        Use this to record a brand-new item being bought for the troop. Both the
        total owned count and in-store count will be set to the quantity
        purchased.
      </p>
      <label style={labelStyle}>Item Name *</label>
      <input
        placeholder="e.g. Rope (50m)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
      />
      <label style={labelStyle}>Category</label>
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        style={inputStyle}
      >
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Quantity Purchased</label>
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
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Unit</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            style={inputStyle}
          >
            {['units', 'kits', 'pairs', 'sets', 'rolls', 'bags'].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>
            <label style={labelStyle}>Item Photo (optional)</label>
      <div
        onClick={() => fileInputRef.current.click()}
        style={{ border: `2px dashed #ddd`, borderRadius: 10, padding: "16px", textAlign: "center", cursor: "pointer", background: "#fafafa", marginTop: 4 }}>
        {imagePreview
          ? <img src={imagePreview} alt="preview" style={{ maxHeight: 140, maxWidth: "100%", borderRadius: 8 }} />
          : <><div style={{ fontSize: 28, marginBottom: 4 }}>🖼️</div><p style={{ margin: 0, color: "#aaa", fontSize: 13 }}>Click to upload a photo</p></>
        }
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
      </div>
      <label style={labelStyle}>Notes</label>
      <textarea
        rows={2}
        placeholder="Storage location, supplier…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ ...inputStyle, resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button
          onClick={onClose}
          style={{ ...btnBase, flex: 1, background: '#eee', color: '#555' }}
        >
          Cancel
        </button>
        <button
          disabled={!name.trim()}
          onClick={() => {
            if (name.trim()) {
                console.log('adding item:', { name, categoryId, qty, unit, notes, imageFile });
                onAdd({
                    name,
                    categoryId,
                    quantity: qty,
                    unit,
                    notes,
                    imageFile,
                });
                onClose();
            }
          }}
          style={{
            ...btnBase,
            flex: 2,
            background: name.trim() ? ACCENT : '#eee',
            color: name.trim() ? '#fff' : '#aaa',
            cursor: name.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Record Purchase
        </button>
      </div>
    </Overlay>
  );
}