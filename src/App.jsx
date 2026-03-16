import React, { useState, useRef, useEffect } from 'react';
import { getItems, addItem, updateItemQuantity, archiveItem, uploadItemImage, updateItem } from './lib/items';
import { getGroups, saveGroup } from './lib/groups';
import { getLog, writeLog } from './lib/log';
import { signOut } from './lib/auth';
import { createCheckout, closeTransaction, getOpenTransactions } from './lib/transactions';
import { getMembers, addMember, deactivateMember, updateMember } from './lib/members';
import { getCategories, addCategory, deleteCategory } from './lib/categories';


// ─── Constants ────────────────────────────────────────────────────────────────
const ACCENT = '#2e7d32';
const ACCENT2 = '#ff8f00';
const BG = '#f5f0e8';
const DARK = '#1a1a1a';
const CATEGORIES = [
  'Shelter',
  'Bedding',
  'Safety',
  'Cooking',
  'Navigation',
  'Clothing',
  'Tools',
  'Storage',
  'Models',
  'Other',
];

const ROLES = [
  { value: "scout", label: "Scout" },
  { value: "troop_leader", label: "Troop Leader" },
  { value: "assistant_leader", label: "Assistant Troop Leader" },
  { value: "quartermaster", label: "Quartermaster" },
  { value: "assistant_qm", label: "Assistant Quartermaster" },
  { value: "committee_member", label: "Committee Member" },
  { value: "scouter", label: "Scouter" },
]

const initialItems = [
  {
    id: 1,
    name: 'Tent (4-person)',
    category: 'Shelter',
    quantity: 6,
    totalOwned: 6,
    unit: 'units',
    image: null,
    removed: false,
  },
  {
    id: 2,
    name: 'Sleeping Bags',
    category: 'Bedding',
    quantity: 20,
    totalOwned: 20,
    unit: 'units',
    image: null,
    removed: false,
  },
  {
    id: 3,
    name: 'First Aid Kit',
    category: 'Safety',
    quantity: 4,
    totalOwned: 4,
    unit: 'kits',
    image: null,
    removed: false,
  },
  {
    id: 4,
    name: 'Cooking Pot (large)',
    category: 'Cooking',
    quantity: 8,
    totalOwned: 8,
    unit: 'units',
    image: null,
    removed: false,
  },
  {
    id: 5,
    name: 'Compass',
    category: 'Navigation',
    quantity: 15,
    totalOwned: 15,
    unit: 'units',
    image: null,
    removed: false,
  },
];

const modalTitleStyle = { 
  margin: 0, 
  fontFamily: "'Playfair Display',serif", 
  fontSize: 20,
  color: "#1b5e20"};

// ─── Shared styles ─────────────────────────────────────────────────────────────
const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#1a1a1a",
  marginBottom: 6,
  marginTop: 14,
  textTransform: "uppercase",
  letterSpacing: 0.8,
};
const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 12px',
  border: '1.5px solid #ddd',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  background: '#fff',
  color: '#1a1a1a'
};
const btnBase = {
  border: 'none',
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
  padding: '11px 0',
};

// ─── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ type }) {
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

// ─── Overlay wrapper ───────────────────────────────────────────────────────────
function Overlay({ children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        width: wide ? 680 : 460,
        maxWidth: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "32px 36px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
        border: "1px solid #e8e0d4",
        color: "#000",
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── Check-out Modal ──────────────────────────────────────────────────────────
function CheckOutModal({ item, groups, onClose, onConfirm }) {
  const [qty, setQty] = useState(1);
  const [qtyDisplay, setQtyDisplay] = useState("1");
  const [groupId, setGroupId] = useState("");
  const [requester, setRequester] = useState("");
  const [checker, setChecker] = useState("");
  const [event, setEvent] = useState("");
  const [remarks, setRemarks] = useState("");
  const max = item.quantity;
  const selectedGroup = groups.find(g => g.id === groupId);

  return (
    <Overlay wide>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={modalTitleStyle}>▼ Check Out: {item.name}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>✕</button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: "#f5f0e8", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>In Store</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif", color: ACCENT }}>{item.quantity}</div>
        </div>
        <div style={{ flex: 1, background: "#f5f0e8", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>Total Owned</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{item.total_owned}</div>
        </div>
      </div>

      <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#7a5800" }}>
        Both <strong>Requester</strong> and <strong>Checker</strong> must be filled for every checkout.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Requested By *</label>
          <input placeholder="Scout applying to take out" value={requester} onChange={e => setRequester(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Checked By (QM on duty) *</label>
          <input placeholder="Quartermaster processing this" value={checker} onChange={e => setChecker(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Quantity (max {max})</label>
          <input type="number" min={1} max={max} value={qtyDisplay}
            onChange={e => { setQtyDisplay(e.target.value); const n = parseInt(e.target.value); if (!isNaN(n)) setQty(Math.max(1, Math.min(max, n))); }}
            onBlur={() => setQtyDisplay(String(qty))}
            style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Event / Activity</label>
          <input placeholder="e.g. Camp Nusantara" value={event} onChange={e => setEvent(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <label style={labelStyle}>Assign to Group (optional)</label>
      <select value={groupId} onChange={e => setGroupId(e.target.value)} style={inputStyle}>
        <option value="">— No group / individual —</option>
        {groups.map(g => (
          <option key={g.id} value={g.id}>{g.name} ({g.type === "led" ? "Led" : "Collective"}, {g.members.length} members)</option>
        ))}
      </select>
      {selectedGroup && (
        <div style={{ background: "#f0f7f0", border: "1px solid #c8e6c9", borderRadius: 8, padding: "10px 14px", marginTop: 8, fontSize: 13 }}>
          <strong style={{ color: ACCENT }}>
            {selectedGroup.type === "led"
              ? `Leader: ${selectedGroup.members.find(m => m.isLeader)?.name || "—"}`
              : `Collective (${selectedGroup.members.length} members)`}
          </strong>
          <p style={{ margin: "3px 0 0", color: "#555" }}>{selectedGroup.members.map(m => m.name).join(", ")}</p>
        </div>
      )}

      <label style={labelStyle}>Remarks (condition on checkout)</label>
      <textarea rows={2} placeholder="e.g. Minor tear on tent fly noted before checkout…" value={remarks} onChange={e => setRemarks(e.target.value)} style={{ ...inputStyle, resize: "vertical" }} />

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={onClose} style={{ ...btnBase, flex: 1, background: "#eee", color: "#555" }}>Cancel</button>
        <button
          disabled={!requester.trim() || !checker.trim()}
          onClick={() => onConfirm({ qty, groupId, groupName: selectedGroup?.name || requester, requester, checker, event, remarks })}
          style={{ ...btnBase, flex: 2, background: requester.trim() && checker.trim() ? ACCENT2 : "#eee", color: requester.trim() && checker.trim() ? "#fff" : "#aaa", cursor: requester.trim() && checker.trim() ? "pointer" : "not-allowed" }}>
          Confirm Check Out
        </button>
      </div>
    </Overlay>
  );
}

// ─── Check-in Modal ────────────────────────────────────────────────────────────
function CheckInModal({ item, openTransactions, onClose, onConfirm }) {
  const maxIn = item.totalOwned - item.quantity;
  const [selectedTxId, setSelectedTxId] = useState(openTransactions[0]?.id || "");
  const [returner, setReturner] = useState("");
  const [checker, setChecker] = useState("");
  const [remarks, setRemarks] = useState("");
  const [condition, setCondition] = useState("Good");
  const selectedTx = openTransactions.find(t => t.id === selectedTxId);

  return (
    <Overlay wide>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={modalTitleStyle}>▲ Check In: {item.name}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>✕</button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: "#f5f0e8", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>In Store</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif", color: ACCENT }}>{item.quantity}</div>
        </div>
        <div style={{ flex: 1, background: "#e8f5e9", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>Outstanding</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif", color: maxIn > 0 ? "#e65100" : DARK }}>{maxIn}</div>
        </div>
      </div>

      {openTransactions.length === 0 ? (
        <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, padding: "14px", fontSize: 14, color: "#7a5800" }}>
          No open checkouts found for this item. All units are already in store.
        </div>
      ) : (
        <>
          <label style={labelStyle}>Select Checkout to Return *</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 4 }}>
            {openTransactions.map(tx => (
              <div key={tx.id} onClick={() => setSelectedTxId(tx.id)}
                style={{ border: `2px solid ${selectedTxId === tx.id ? ACCENT : "#ddd"}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer", background: selectedTxId === tx.id ? "#f0f7f0" : "#fafafa" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{tx.requester_name}</strong>
                    {tx.event && <span style={{ color: "#888", fontSize: 12 }}> · {tx.event}</span>}
                  </div>
                  <span style={{ fontWeight: 700, color: ACCENT2 }}>{tx.qty} {item.unit}</span>
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>
                  Out since {new Date(tx.checked_out_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} · QM: {tx.checkout_checker_name}
                </div>
                {tx.checkout_remarks && <div style={{ fontSize: 12, color: "#a0522d", marginTop: 2 }}>Checkout note: {tx.checkout_remarks}</div>}
              </div>
            ))}
          </div>

          <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, padding: "10px 14px", margin: "8px 0", fontSize: 13, color: "#7a5800" }}>
            Both <strong>Returner</strong> and <strong>Checker</strong> must be filled for every return.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Returned By *</label>
              <input placeholder="Who is handing items back" value={returner} onChange={e => setReturner(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Checked By (QM on duty) *</label>
              <input placeholder="Quartermaster receiving this" value={checker} onChange={e => setChecker(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <label style={labelStyle}>Condition on Return</label>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            {["Good", "Fair", "Damaged"].map(c => (
              <div key={c} onClick={() => setCondition(c)}
                style={{ flex: 1, textAlign: "center", padding: "9px 0", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
                  background: condition === c ? (c === "Good" ? "#e8f5e9" : c === "Fair" ? "#fff8e1" : "#fce4ec") : "#f0f0f0",
                  color: condition === c ? (c === "Good" ? ACCENT : c === "Fair" ? "#f57f17" : "#c62828") : "#aaa",
                  border: `2px solid ${condition === c ? (c === "Good" ? "#a5d6a7" : c === "Fair" ? "#ffe082" : "#ef9a9a") : "transparent"}` }}>
                {c === "Good" ? "✓ Good" : c === "Fair" ? "~ Fair" : "⚠ Damaged"}
              </div>
            ))}
          </div>

          <label style={labelStyle}>Remarks (damage details, notes)</label>
          <textarea rows={2} placeholder="e.g. Zip broken on return, compass glass cracked…" value={remarks} onChange={e => setRemarks(e.target.value)} style={{ ...inputStyle, resize: "vertical" }} />

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={onClose} style={{ ...btnBase, flex: 1, background: "#eee", color: "#555" }}>Cancel</button>
            <button
              disabled={!returner.trim() || !checker.trim() || !selectedTxId}
              onClick={() => onConfirm({ txId: selectedTxId, qty: selectedTx?.qty || 1, groupId: selectedTx?.group_id, groupName: selectedTx?.group_id, returner, checker, condition, remarks })}
              style={{ ...btnBase, flex: 2, background: returner.trim() && checker.trim() ? ACCENT : "#eee", color: returner.trim() && checker.trim() ? "#fff" : "#aaa", cursor: returner.trim() && checker.trim() ? "pointer" : "not-allowed" }}>
              Confirm Return
            </button>
          </div>
        </>
      )}
    </Overlay>
  );
}

// ─── Write-off Modal ───────────────────────────────────────────────────────────
function WriteOffModal({ item, onClose, onConfirm }) {
  const [qty, setQty] = useState(1);
  const [qtyDisplay, setQtyDisplay] = useState('1');
  const [reason, setReason] = useState('');
  const max = item.quantity;
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
            color: '#c62828',
          }}
        >
          ✕ Write Off Units
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
          color: '#555',
          marginBottom: 16,
          lineHeight: 1.5,
          fontSize: 14,
        }}
      >
        Permanently reduce stock of <strong>{item.name}</strong>. The item stays
        in inventory — only the unit count drops.
      </p>

      <label style={labelStyle}>Units to write off (max {item.quantity})</label>
      <input
        type="number"
        min={1}
        max={item.quantity}
        value={qtyDisplay}
        onChange={(e) => {
          setQtyDisplay(e.target.value);
          const num = parseInt(e.target.value);
          if (!isNaN(num)) setQty(Math.max(1, Math.min(max, num)));
        }}
        onBlur={() => setQtyDisplay(String(qty))}
        style={inputStyle}
      />

      <label style={labelStyle}>Reason</label>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        style={inputStyle}
      >
        <option value="">Select a reason…</option>
        <option>Damaged / broken</option>
        <option>Lost at activity</option>
        <option>Worn out / end of life</option>
        <option>Stolen</option>
        <option>Other</option>
      </select>

      <div
        style={{
          background: '#fff8e1',
          border: '1px solid #ffe082',
          borderRadius: 8,
          padding: '10px 14px',
          margin: '14px 0',
          fontSize: 13,
          color: '#7a5800',
        }}
      >
        ⚠️ Stock will go from <strong>{item.quantity}</strong> →{' '}
        <strong>{item.quantity - qty}</strong> {item.unit}. This cannot be
        undone.
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onClose}
          style={{ ...btnBase, flex: 1, background: '#eee', color: '#555' }}
        >
          Cancel
        </button>
        <button
          disabled={!reason}
          onClick={() => onConfirm({ qty, reason })}
          style={{
            ...btnBase,
            flex: 2,
            background: reason ? '#c62828' : '#eee',
            color: reason ? '#fff' : '#aaa',
            cursor: reason ? 'pointer' : 'not-allowed',
          }}
        >
          Write Off {qty} {item.unit}
        </button>
      </div>
    </Overlay>
  );
}

// ─── Add Item Modal (new purchase) ────────────────────────────────────────────
function AddItemModal({ onClose, onAdd, categories }) {
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
              onAdd({ name, categoryId, quantity: qty, unit, notes });
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

// ─── Buy More Modal (restock existing item) ────────────────────────────────────
function BuyMoreModal({ item, onClose, onConfirm }) {
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
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            Receive into storeroom now
          </div>
          <div style={{ fontSize: 12, color: '#777' }}>
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
          style={{ ...btnBase, flex: 1, background: '#eee', color: '#555' }}
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

// ─── Remove Item Modal ─────────────────────────────────────────────────────────
function RemoveItemModal({ item, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  return (
    <Overlay>
      <h2
        style={{
          margin: '0 0 8px',
          fontFamily: "'Playfair Display',serif",
          fontSize: 20,
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
      <div
        style={{
          background: '#fff8e1',
          border: '1px solid #ffe082',
          borderRadius: 8,
          padding: '10px 14px',
          margin: '14px 0',
          fontSize: 13,
          color: '#7a5800',
        }}
      >
        ⚠️ This removes the item from active inventory. Log history is kept.
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onClose}
          style={{ ...btnBase, flex: 1, background: '#eee', color: '#555' }}
        >
          Cancel
        </button>
        <button
          disabled={!reason}
          onClick={() => onConfirm(reason)}
          style={{
            ...btnBase,
            flex: 2,
            background: reason ? '#c62828' : '#eee',
            color: reason ? '#fff' : '#aaa',
            cursor: reason ? 'pointer' : 'not-allowed',
          }}
        >
          Archive Item
        </button>
      </div>
    </Overlay>
  );
}

// ─── Group Manager Modal ───────────────────────────────────────────────────────
function GroupModal({ group, onClose, onSave }) {
  const isEdit = !!group;
  const [name, setName] = useState(group?.name || '');
  const [type, setType] = useState(group?.type || 'led');
  const [members, setMembers] = useState(group?.members || []);
  const [newMember, setNewMember] = useState('');

  const addMember = () => {
    const selected = availableMembers.find(m => m.id === newMember)
    if (!selected || members.find(m => m.member_id === selected.id)) return
    const isFirst = members.length === 0
    setMembers(prev => [...prev, {
      id: Date.now(),
      member_id: selected.id,
      name: selected.full_name,
      isLeader: isFirst && type === "led"
    }])
    setNewMember("")
  };

  const removeMember = (id) => {
    const wasLeader = members.find((m) => m.id === id)?.isLeader;
    const updated = members.filter((m) => m.id !== id);
    if (type === 'led' && wasLeader && updated.length > 0)
      updated[0].isLeader = true;
    setMembers(updated);
  };

  const setLeader = (id) =>
    setMembers((prev) => prev.map((m) => ({ ...m, isLeader: m.id === id })));

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
        <h2
          style={modalTitleStyle}
        >
          {isEdit ? '✎ Edit Group' : '👥 New Group'}
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

      <label style={labelStyle}>Group Name *</label>
      <input
        placeholder="e.g. Eagle Patrol"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
      />

      <label style={labelStyle}>Leadership Type</label>
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        {[
          {
            val: 'led',
            icon: '👑',
            title: 'Led Group',
            desc: 'One designated leader holds responsibility',
          },
          {
            val: 'collective',
            icon: '🤝',
            title: 'Collective',
            desc: 'Responsibility shared equally among all members',
          },
        ].map((opt) => (
          <div
            key={opt.val}
            onClick={() => {
              setType(opt.val);
              if (opt.val === 'collective')
                setMembers((prev) =>
                  prev.map((m) => ({ ...m, isLeader: false }))
                );
            }}
            style={{
              flex: 1,
              border: `2px solid ${type === opt.val ? ACCENT : '#ddd'}`,
              borderRadius: 10,
              padding: '12px 14px',
              cursor: 'pointer',
              background: type === opt.val ? '#f0f7f0' : '#fafafa',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 22 }}>{opt.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>
              {opt.title}
            </div>
            <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>
              {opt.desc}
            </div>
          </div>
        ))}
      </div>

      <label style={{ ...labelStyle, marginTop: 18 }}>Members</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <select
          value={newMember}
          onChange={e => setNewMember(e.target.value)}
          style={inputStyle}>
          <option value="">Select a member</option>
          {availableMembers
            .filter(m => !members.find(existing => existing.member_id === m.id))
            .map(m => (
              <option key={m.id} value={m.id}>
                {m.full_name}{m.role != 'Scout' ? ` (${m.role})` : ""}
              </option>
            ))}
        </select>
        <button
          onClick={addMember}
          style={{
            padding: '9px 16px',
            background: ACCENT,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          + Add
        </button>
      </div>

      {members.length === 0 ? (
        <p style={{ color: '#bbb', fontStyle: 'italic', fontSize: 13 }}>
          No members yet.
        </p>
      ) : (
        <div
          style={{
            border: '1px solid #e8e0d4',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {members.map((m, i) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderBottom:
                  i < members.length - 1 ? '1px solid #f0ece4' : 'none',
                background: m.isLeader && type === 'led' ? '#f0f7f0' : '#fff',
              }}
            >
              <span style={{ fontSize: 16 }}>
                {type === 'led' && m.isLeader ? '👑' : '🧑'}
              </span>
              <span style={{ flex: 1, fontWeight: 600 }}>{m.name}</span>
              {type === 'led' &&
                (m.isLeader ? (
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
                ) : (
                  <button
                    onClick={() => setLeader(m.id)}
                    style={{
                      fontSize: 11,
                      background: '#eee',
                      color: '#555',
                      border: 'none',
                      borderRadius: 6,
                      padding: '3px 10px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Make Leader
                  </button>
                ))}
              {type === 'collective' && (
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
              <button
                onClick={() => removeMember(m.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#e57373',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
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
              onSave({ name, type, members });
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
          {isEdit ? 'Save Changes' : 'Create Group'}
        </button>
      </div>
    </Overlay>
  );
}

// ─── Group Detail Modal ────────────────────────────────────────────────────────
function GroupDetailModal({ group, onClose, onEdit }) {
  const outstanding = group.checkouts || [];
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
            style={{
              margin: 0,
              fontFamily: "'Playfair Display',serif",
              fontSize: 22,
            }}
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
              padding: '7px 14px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            ✎ Edit
          </button>
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
            {group.members.length}
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
        {group.members.length === 0 ? (
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
          group.members.map((m, i) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderBottom:
                  i < group.members.length - 1 ? '1px solid #f0ece4' : 'none',
              }}
            >
              <span>{group.type === 'led' && m.isLeader ? '👑' : '🧑'}</span>
              <span style={{ flex: 1 }}>{m.name}</span>
              {group.type === 'led' && m.isLeader && (
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

// -- Member Modal ───────────────────────────────────────────────────────────────
function AddMemberModal({ onClose, onAdd, onEdit, member }) {
  console.log('onEdit prop:', member)  // add this temporarily
  const isEdit = !!member
  const [fullName, setFullName] = useState(member?.fullName ||"")
  const [email, setEmail] = useState(member?.email || "")
  const [role, setRole] = useState(member?.role || "scout")
  const handleSubmit = async () => {
    if (!isEdit && !fullName.trim()) return
    const data = {
      full_name: fullName,
      email: email || null,
      role,
      active: true,
    }
    try {
      if (isEdit) {
        await onEdit(member.id, { role })
      } else {
        await onAdd(data)
      }
      onClose()
    } catch (error) {
      console.error("Error saving member:", error)
      alert(error.message)
    }
  }

  return (
    <Overlay>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={modalTitleStyle}>{isEdit ? "✎ Edit Member" : "👤 Add Member"}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>✕</button>
      </div>

      {isEdit ? (
        <>
          <div style={{ background: "#f5f0e8", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontFamily: "'Playfair Display', serif", fontSize: 16 }}>{member.full_name}</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{member.email || "No email"}</div>
          </div>
          <label style={labelStyle}>Role</label>
          <select value={role} onChange={e => setRole(e.target.value)} style={inputStyle}>
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </>
      ) : (
        <>
        <label style={labelStyle}>Full Name *</label>
        <input placeholder="e.g. Ahmad bin Razak" value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Email</label>
        <input type="email" placeholder="e.g. ahmad@scouts.my" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Role</label>
        <select value={role} onChange={e => setRole(e.target.value)} style={inputStyle}>
          {ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        </>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={onClose} style={{ ...btnBase, flex: 1, background: "#eee", color: "#555" }}>Cancel</button>
        <button
          disabled={!isEdit && !fullName.trim()}
          onClick={handleSubmit}
          style={{ ...btnBase, flex: 2, 
            background: (!isEdit &&fullName.trim()) ? "#eee" : ACCENT, 
            color: !isEdit && !fullName.trim() ? "#aaa" : "#fff", 
            cursor: !isEdit && !fullName.trim() ? "not-allowed" : "pointer"}}>
          {isEdit ? "Save Changes" : "Add Member"}
        </button>
      </div>
    </Overlay>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [log, setLog] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([])
  const [categories, setCategories] = useState([])  // add here
  const [modal, setModal] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [showRemoved, setShowRemoved] = useState(false);
  const [loading, setLoading] = useState([]);
  const [newCategory, setNewCategory] = useState("")
  const nextId = useRef(200);

  useEffect(() => {
    async function load() {
      const [itemsData, groupsData, logData, txData, membersData, categoriesData] = await Promise.all([
        getItems(),
        getGroups(),
        getLog(),
        getOpenTransactions(),
        getMembers(),
        getCategories(),
      ])
      setItems(itemsData);
      setGroups(groupsData);
      setLog(logData);
      setTransactions(txData);
      setLoading(false);
      setMembers(membersData);
      setCategories(categoriesData);
    }
    load();
  }, [])

  if (loading) return (
    <div style={{ padding: 40, fontFamily: 'serif' }}>Loading storeroom...</div>
  )

  const addLog = async (entry) => {
    console.log('addLog called with:', entry)
    const logEntry = {
      type: entry.type,
      item_id: entry.itemId || null,
      item_name: entry.itemName,
      qty: entry.qty,
      unit: entry.unit,
      requester_name: entry.requester || null,
      returner_name: entry.returner || null,
      checker_name: entry.checker || null,
      event: entry.event || null,
      notes: entry.notes || null,
      
    }
    console.log('writing to supabase:', logEntry) 
    const saved = await writeLog(logEntry);
    setLog((prev) => [saved, ...prev]);
  }

  // ── Item handlers ──
  const handleCheckOut = async (item, { qty, groupId, groupName, requester, checker, event, remarks }) => {
    const tx = {
      item_id: item.id,
      group_id: groupId || null,
      qty,
      requester_name: requester,
      checkout_checker_name: checker,
      event: event || null,
      checkout_remarks: remarks || null,
      checked_out_at: new Date(),
    }
    await createCheckout(tx)
    await updateItemQuantity(item.id, item.quantity - qty, item.total_owned)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - qty } : i))
    if (groupId) {
      setGroups(prev => prev.map(g => g.id === groupId
        ? { ...g, checkouts: [...(g.checkouts || []), { itemId: item.id, itemName: item.name, unit: item.unit, qty, date: Date.now(), event }] }
        : g))
    }
    await addLog({
      type: 'OUT',
      itemId: item.id,
      itemName: item.name,
      qty,
      unit: item.unit,
      requester: requester || null,
      checker: checker || null,
      event: event || null,
      notes: remarks || null,
    })
    setModal(null)
  }

  const handleCheckIn = async (item, { txId, qty, groupId, groupName, returner, checker, condition, remarks }) => {
    await closeTransaction(txId, {
      returner_name: returner,
      return_checker_name: checker,
      condition,
      return_remarks: remarks || null,
    })
    await updateItemQuantity(item.id, item.quantity + qty, item.total_owned)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + qty } : i))
    setTransactions(prev => prev.filter(t => t.id !== txId))
    if (groupId) {
      setGroups(prev => prev.map(g => {
        if (g.id !== groupId) return g
        const idx = (g.checkouts || []).findIndex(c => c.itemId === item.id)
        if (idx === -1) return g
        const updated = [...g.checkouts]
        updated.splice(idx, 1)
        return { ...g, checkouts: updated }
      }))
    }
    await addLog({
      type: 'IN',
      itemId: item.id,
      itemName: item.name,
      qty,
      unit: item.unit,
      returner: returner || null,
      checker: checker || null,
      event: null,
      notes: `${condition}${remarks ? ' — ' + remarks : ''}`,
    })
    setModal(null)
  }

  const handleWriteOff = async (item, { qty, reason }) => {
    const newQuantity = item.quantity - qty;
    const newTotalOwned = item.total_owned - qty;
    await updateItemQuantity(item.id, newQuantity, newTotalOwned);
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, quantity: newQuantity, total_owned: newTotalOwned }
          : i
      )
    );
    await addLog({
      type: 'WRITEOFF',
      itemName: item.name,
      qty,
      unit: item.unit,
      scout: 'Quartermaster',
      notes: reason,
      event: 'Write-off',
    });
    setModal(null);
  };

  const handleAddItem = async (data) => {
    const newItem = await addItem({
      name: data.name,
      category_id: data.categoryId,
      quantity: data.quantity,
      total_owned: data.quantity,
      unit: data.unit,
      notes: data.notes || null,
      removed: false,
    })

    // upload image if one was selected
    if (data.imageFile) {
      const imageUrl = await uploadItemImage(data.imageFile, newItem.id)
      await updateItem(newItem.id, { image_url: imageUrl })
      newItem.image_url = imageUrl
    }
    setItems((prev) => [...prev, newItem]);
    await addLog({
      type: 'ADD',
      itemId: newItem.id,
      itemName: newItem.name,
      qty: newItem.quantity,
      unit: newItem.unit,
      scout: 'Quartermaster',
      notes: data.notes || '',
      event: 'New purchase',
    });
  };

  const handleBuyMore = async (item, { qty, receiveNow, notes }) => {
    const newTotalOwned = item.total_owned + qty;
    const newQuantity = receiveNow ? item.quantity + qty : item.quantity;

    await updateItemQuantity(item.id, newQuantity, newTotalOwned);
    setItems(prev => prev.map(i => i.id === item.id
      ? { ...i, total_owned: newTotalOwned, quantity: newQuantity }
      : i
    ));
    await addLog({
      type: 'ADD',
      itemId: item.id,
      itemName: item.name,
      qty,
      unit: item.unit,
      checker: 'Quartermaster',
      notes: notes || null,
      event: receiveNow ? 'Restock — received' : 'Restock — pending delivery',
    });
    setModal(null);
  };

  const handleRemoveItem = async (item, reason) => {
    await archiveItem(item.id, reason);
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, removed: true, removedReason: reason } : i
      )
    );
    await addLog({
      type: 'DELETE',
      itemName: item.name,
      qty: item.quantity,
      unit: item.unit,
      scout: 'Quartermaster',
      notes: reason,
      event: 'Item archived',
    });
    setModal(null);
  };

  // -- Category handlers --
  const handleAddCategory = async (name) => {
    const newCat = await addCategory(name)
    setCategories(prev => [...prev, newCat])
  }

  const handleRemoveCategory = async (id) => {
    await deleteCategory(id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  // ── Group handlers ──
  const handleSaveGroup = async (data, editId) => {
    const saved = await saveGroup({ ...data, id: editId || undefined })
    if (editId) {
      setGroups(prev => prev.map(g => g.id === editId ? saved : g))
    } else {
      setGroups(prev => [...prev, { ...saved, checkouts: [] }])
    }
  };

  // -- Member handlers --
  const handleAddMember = async (data) => {
    const newMember = await addMember(data)
    setMembers(prev => [...prev, newMember])
  }

  const handleDeactivateMember = async (id) => {
    await deactivateMember(id)
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  const handleEditMember = async (id, data) => {
    console.log('handleEditMember called:', id, data)
    try {
      const updated = await updateMember(id, data)
      console.log('updated:', updated)
      setMembers(prev => prev.map(m => m.id === id ? updated : m))
    } catch (err) {
      console.error('handleEditMember error:', err)
      alert(err.message)
    }
  }

  // ── Derived ──
  const activeItems = items.filter((i) => !i.removed);
  const removedItems = items.filter((i) => i.removed);
  const displayItems = (showRemoved ? removedItems : activeItems).filter(
    (i) => {
      const s = search.toLowerCase();
      return (
        (i.name.toLowerCase().includes(s) ||
          i.category.toLowerCase().includes(s)) &&
        (filterCat === 'All' || i.category === filterCat)
      );
    }
  );
  const lowStock = activeItems.filter((i) => i.quantity <= 2);
  const totalUnits = activeItems.reduce((a, b) => a + b.quantity, 0);
  const groupsWithItems = groups.filter((g) => (g.checkouts || []).length > 0);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG,
        fontFamily: "'Source Serif 4', Georgia, serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400&display=swap"
        rel="stylesheet"
      />

      {/* HEADER */}
      <header
        style={{
          background: DARK,
          color: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `4px solid ${ACCENT2}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 0',
          }}
        >
          <span style={{ fontSize: 34 }}>⚜️</span>
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: "'Playfair Display',serif",
                fontSize: 21,
                letterSpacing: 0.5,
              }}
            >
              Storeroom Ledger
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: '#aaa',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              Scout Quartermaster System
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setModal({ type: 'addItem' })}
            style={{
              padding: '8px 14px',
              background: ACCENT,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            ＋ Item
          </button>
          <button
            onClick={() => setModal({ type: 'newGroup' })}
            style={{
              padding: '8px 14px',
              background: '#455a64',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            👥 Group
          </button>
          <button
            onClick={() => signOut()}
            style={{ padding: '8px 14px', background: '#ff0000', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
            SIGN OUT
          </button>
        </div>
      </header>

      {/* STATS */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e0e0e0',
          padding: '10px 28px',
          display: 'flex',
          gap: 28,
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'Active Items', val: activeItems.length, icon: '📦' },
          { label: 'Units in Store', val: totalUnits, icon: '🔢' },
          { label: 'Groups', val: groups.length, icon: '👥' },
          {
            label: 'Groups w/ Items Out',
            val: groupsWithItems.length,
            icon: '📤',
            alert: groupsWithItems.length > 0,
          },
          {
            label: 'Low Stock',
            val: lowStock.length,
            icon: '⚠️',
            alert: lowStock.length > 0,
          },
          { label: 'Log Entries', val: log.length, icon: '📋' },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18 }}>{s.icon}</div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                fontFamily: "'Playfair Display',serif",
                color: s.alert ? '#c62828' : DARK,
              }}
            >
              {s.val}
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: 0.4,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div
        style={{
          display: 'flex',
          padding: '0 28px',
          background: '#fff',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        {['inventory', 'groups', 'members', 'log', 'categories'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 22px',
              border: 'none',
              background: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              borderBottom:
                activeTab === tab
                  ? `3px solid ${ACCENT}`
                  : '3px solid transparent',
              color: activeTab === tab ? ACCENT : '#888',
              fontFamily: 'inherit',
              letterSpacing: 0.5,
            }}
          >
            {tab === 'inventory'
              ? '📦 Inventory'
              : tab === 'groups'
              ? '👥 Groups'
              : tab === "members" 
              ? "👤 Members"
              : tab === "log"
              ? '📋 Log'
              : '📂 Categories'}
          </button>
        ))}
      </div>

      <main style={{ padding: '22px 28px', maxWidth: 1140, margin: '0 auto' }}>
        {/* ── INVENTORY TAB ── */}
        {activeTab === 'inventory' && (
          <>
            {lowStock.length > 0 && (
              <div
                style={{
                  background: '#fff8e1',
                  border: '1px solid #ffe082',
                  borderRadius: 10,
                  padding: '10px 18px',
                  marginBottom: 18,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 20 }}>⚠️</span>
                <div>
                  <strong style={{ color: '#e65100' }}>Low Stock: </strong>
                  <span style={{ color: '#555' }}>
                    {lowStock
                      .map((i) => `${i.name} (${i.quantity})`)
                      .join(', ')}
                  </span>
                </div>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 18,
                flexWrap: 'wrap',
              }}
            >
              <input
                placeholder="🔍 Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1, minWidth: 180, ...inputStyle }}
              />
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                style={{ ...inputStyle, width: 'auto', flex: 'none' }}
              >
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button
                onClick={() => setShowRemoved((v) => !v)}
                style={{
                  padding: '9px 14px',
                  background: showRemoved ? '#fce4ec' : '#f5f0e8',
                  color: showRemoved ? '#c62828' : '#666',
                  border: showRemoved
                    ? '1.5px solid #ef9a9a'
                    : '1.5px solid #ddd',
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {showRemoved ? '👁 Archived' : '🗑️ Show Archived'}
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 14,
                flexWrap: 'wrap',
              }}
            >
              {[
                {
                  label: '▼ Out — Check out units',
                  color: '#e65100',
                  bg: '#fff3e0',
                },
                {
                  label: '▲ In — Return units to store',
                  color: '#2e7d32',
                  bg: '#e8f5e9',
                },
                {
                  label: '🛒 — Buy more units',
                  color: '#1565c0',
                  bg: '#e3f2fd',
                },
                {
                  label: '✕ — Write off damaged/lost units',
                  color: '#c62828',
                  bg: '#fff3e0',
                },
                {
                  label: '🗑 — Archive entire item',
                  color: '#c62828',
                  bg: '#fce4ec',
                },
              ].map((l) => (
                <span
                  key={l.label}
                  style={{
                    fontSize: 11,
                    background: l.bg,
                    color: l.color,
                    borderRadius: 6,
                    padding: '3px 9px',
                    fontWeight: 600,
                  }}
                >
                  {l.label}
                </span>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))',
                gap: 14,
              }}
            >
              {displayItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: item.removed ? '#fafafa' : '#fff',
                    borderRadius: 14,
                    border: item.removed
                      ? '1px dashed #e0a0a0'
                      : '1px solid #e8e0d4',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    opacity: item.removed ? 0.75 : 1,
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!item.removed)
                      e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
                >
                  {item.image && (
                    <img
                      src={item.imageUrl || item.image}
                      alt={item.name}
                      style={{
                        width: '100%',
                        height: 110,
                        objectFit: 'cover',
                        filter: item.removed ? 'grayscale(60%)' : 'none',
                      }}
                    />
                  )}
                  <div style={{ padding: '13px 15px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <h3
                        style={{
                          margin: '0 0 3px',
                          fontFamily: "'Playfair Display',serif",
                          fontSize: 15,
                          color: item.removed ? '#aaa' : DARK,
                          textDecoration: item.removed
                            ? 'line-through'
                            : 'none',
                        }}
                      >
                        {item.name}
                      </h3>
                      <span
                        style={{
                          fontSize: 10,
                          background: '#f0ece4',
                          color: '#666',
                          borderRadius: 6,
                          padding: '2px 7px',
                          flexShrink: 0,
                          marginLeft: 6,
                        }}
                      >
                        {item.category}
                      </span>
                    </div>
                    {item.removed ? (
                      <div
                        style={{
                          margin: '8px 0',
                          padding: '7px 10px',
                          background: '#fce4ec',
                          borderRadius: 8,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            color: '#c62828',
                            fontWeight: 700,
                          }}
                        >
                          ✕ Archived
                        </p>
                        <p
                          style={{
                            margin: '2px 0 0',
                            fontSize: 11,
                            color: '#888',
                          }}
                        >
                          {item.removedReason}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div style={{ margin: '6px 0 10px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'baseline',
                              gap: 4,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 26,
                                fontWeight: 900,
                                fontFamily: "'Playfair Display',serif",
                                color: item.quantity <= 2 ? '#c62828' : ACCENT,
                              }}
                            >
                              {item.quantity}
                            </span>
                            <span style={{ fontSize: 12, color: '#888' }}>
                              in store
                            </span>
                            <span
                              style={{
                                fontSize: 13,
                                color: '#bbb',
                                margin: '0 2px',
                              }}
                            >
                              /
                            </span>
                            <span
                              style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: '#555',
                              }}
                            >
                              {item.total_owned}
                            </span>
                            <span style={{ fontSize: 12, color: '#888' }}>
                              owned
                            </span>
                          </div>
                          {item.quantity < item.total_owned && (
                            <div
                              style={{
                                fontSize: 11,
                                color: '#e65100',
                                marginTop: 2,
                              }}
                            >
                              {item.total_owned - item.quantity} {item.unit}{' '}
                              currently out
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() =>
                              setModal({ type: 'checkout', item })
                            }
                            disabled={item.quantity === 0}
                            style={{
                              flex: 1,
                              padding: '7px 0',
                              background:
                                item.quantity === 0 ? '#eee' : '#fff3e0',
                              color: item.quantity === 0 ? '#ccc' : '#e65100',
                              border: 'none',
                              borderRadius: 7,
                              fontWeight: 700,
                              cursor:
                                item.quantity === 0 ? 'not-allowed' : 'pointer',
                              fontSize: 12,
                            }}
                          >
                            ▼ Out
                          </button>
                          <button
                            onClick={() =>
                              setModal({ type: 'checkin', item })
                            }
                            disabled={item.quantity >= item.total_owned}
                            title={
                              item.quantity >= item.total_owned
                                ? 'All owned units are already in store'
                                : 'Check units back in'
                            }
                            style={{
                              flex: 1,
                              padding: '7px 0',
                              background:
                                item.quantity >= item.total_owned
                                  ? '#eee'
                                  : '#e8f5e9',
                              color:
                                item.quantity >= item.total_owned
                                  ? '#ccc'
                                  : '#2e7d32',
                              border: 'none',
                              borderRadius: 7,
                              fontWeight: 700,
                              cursor:
                                item.quantity >= item.total_owned
                                  ? 'not-allowed'
                                  : 'pointer',
                              fontSize: 12,
                            }}
                          >
                            ▲ In
                          </button>
                          <button
                            onClick={() => setModal({ type: 'buyMore', item })}
                            title="Buy more units"
                            style={{
                              padding: '7px 10px',
                              background: '#e3f2fd',
                              color: '#1565c0',
                              border: '1.5px solid #90caf9',
                              borderRadius: 7,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            🛒
                          </button>
                          <button
                            onClick={() => setModal({ type: 'writeoff', item })}
                            title="Write off damaged/lost units"
                            style={{
                              padding: '7px 10px',
                              background: '#fff3e0',
                              color: '#c62828',
                              border: '1.5px solid #ffcc80',
                              borderRadius: 7,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            ✕
                          </button>
                          <button
                            onClick={() =>
                              setModal({ type: 'removeItem', item })
                            }
                            title="Archive entire item"
                            style={{
                              padding: '7px 10px',
                              background: '#fce4ec',
                              color: '#c62828',
                              border: '1.5px solid #ef9a9a',
                              borderRadius: 7,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {displayItems.length === 0 && (
                <p
                  style={{
                    color: '#aaa',
                    fontStyle: 'italic',
                    gridColumn: '1/-1',
                  }}
                >
                  No items found.
                </p>
              )}
            </div>
          </>
        )}

        {/* ── GROUPS TAB ── */}
        {activeTab === 'groups' && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
              }}
            >
              <p style={{ margin: 0, color: '#777', fontSize: 14 }}>
                Manage patrols and assign item responsibility to groups.
              </p>
              <button
                onClick={() => setModal({ type: 'newGroup' })}
                style={{
                  padding: '8px 16px',
                  background: ACCENT,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                👥 New Group
              </button>
            </div>

            {groups.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#bbb',
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
                <p style={{ fontStyle: 'italic', fontSize: 15 }}>
                  No groups yet. Create a patrol or collective to track item
                  responsibility.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
                  gap: 14,
                }}
              >
                {groups.map((group) => {
                  const out = group.checkouts || [];
                  const leader = group.members.find((m) => m.isLeader);
                  return (
                    <div
                      key={group.id}
                      onClick={() => setModal({ type: 'groupDetail', group })}
                      style={{
                        background: '#fff',
                        borderRadius: 14,
                        border: '1px solid #e8e0d4',
                        padding: '16px 18px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = 'translateY(-2px)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = '')
                      }
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <h3
                          style={{
                            margin: '0 0 4px',
                            fontFamily: "'Playfair Display',serif",
                            fontSize: 17,
                          }}
                        >
                          {group.name}
                        </h3>
                        <span
                          style={{
                            fontSize: 11,
                            background:
                              group.type === 'led' ? '#fff9c4' : '#e3f2fd',
                            color: group.type === 'led' ? '#f57f17' : '#1565c0',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontWeight: 700,
                          }}
                        >
                          {group.type === 'led' ? '👑 Led' : '🤝 Collective'}
                        </span>
                      </div>
                      {group.type === 'led' && leader && (
                        <p
                          style={{
                            margin: '0 0 8px',
                            fontSize: 12,
                            color: '#777',
                          }}
                        >
                          Leader: <strong>{leader.name}</strong>
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontFamily: "'Playfair Display',serif",
                              fontSize: 20,
                            }}
                          >
                            {group.members.length}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: '#888',
                              textTransform: 'uppercase',
                            }}
                          >
                            Members
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontFamily: "'Playfair Display',serif",
                              fontSize: 20,
                              color: out.length > 0 ? '#e65100' : DARK,
                            }}
                          >
                            {out.length}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: '#888',
                              textTransform: 'uppercase',
                            }}
                          >
                            Items Out
                          </div>
                        </div>
                      </div>
                      {out.length > 0 && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: '7px 10px',
                            background: '#fff3e0',
                            borderRadius: 8,
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              color: '#e65100',
                              fontWeight: 700,
                            }}
                          >
                            Outstanding: {out.map((c) => c.itemName).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* -- MEMBERS TAB -- */}
        {activeTab === "members" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <p style={{ margin: 0, color: "#777", fontSize: 14 }}>Manage troop members and their roles.</p>
              <button onClick={() => setModal({ type: "addMember" })}
                style={{ padding: "8px 16px", background: ACCENT, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                👤 Add Member
              </button>
            </div>

            {members.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#bbb" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
                <p style={{ fontStyle: "italic", fontSize: 15 }}>No members yet. Add scouts and committee members.</p>
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8e0d4", overflow: "hidden" }}>
                {members.map((member, i) => (
                  <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: i < members.length - 1 ? "1px solid #f0ece4" : "none" }}>
                    <div style={{ width: 40, height: 40, 
                      borderRadius: "50%", 
                      background: 
                        ["troop_leader", "assistant_leader", "scouter", "quartermaster"].includes(member.role) 
                          ? ACCENT 
                          : member.role === "assistant_qm" ? ACCENT2 
                          : "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                      {["troop_leader", "assistant_leader", "scouter"].includes(member.role) ? "⚜️" : ["quartermaster", "assistant_qm"].includes(member.role) ? "🔑" : "🧑"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontFamily: "'Playfair Display', serif", fontSize: 15 }}>{member.full_name}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                        {member.email || "No email"}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11,
                      background: ["quartermaster", "troop_leader", "scouter"].includes(member.role) ? "#e8f5e9"
                        : ["assistant_qm", "assistant_leader"].includes(member.role) ? "#fff3e0"
                        : "#f5f0e8",
                      color: ["quartermaster", "troop_leader", "scouter"].includes(member.role) ? ACCENT
                        : ["assistant_qm", "assistant_leader"].includes(member.role) ? "#e65100"
                        : "#888",
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontWeight: 700
                    }}>
                      {ROLES.find(r => r.value === member.role)?.label || member.role}
                    </span>
                  <button
                    onClick={() => setModal({ type: "editMember", member })}
                    style={{ padding: "6px 12px", background: "#e3f2fd", color: "#1565c0", border: "none", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 12, marginRight: 6 }}>
                    ✎ Edit
                  </button>
                  <button
                    onClick={() => handleDeactivateMember(member.id)}
                    style={{ padding: "6px 12px", background: "#fce4ec", color: "#c62828", border: "none", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 12 }}>
                    Remove
                  </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── LOG TAB ── */}
        {activeTab === 'log' && (
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              border: '1px solid #e8e0d4',
              overflow: 'hidden',
            }}
          >
            {log.length === 0 ? (
              <p
                style={{
                  textAlign: 'center',
                  color: '#bbb',
                  padding: 48,
                  fontStyle: 'italic',
                }}
              >
                No movements recorded yet.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr
                      style={{
                        background: '#f5f0e8',
                        borderBottom: '2px solid #e0d8cc',
                      }}
                    >
                      {[
                        'Time',
                        'Type',
                        'Item',
                        'Qty',
                        'Scout / Group',
                        'Event',
                        'Notes',
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '11px 13px',
                            textAlign: 'left',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: 0.7,
                            color: '#888',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {log.map((entry, i) => (
                      <tr
                        key={entry.id}
                        style={{
                          borderBottom: '1px solid #f0ece4',
                          background: i % 2 === 0 ? '#fff' : '#fdfaf6',
                        }}
                      >
                        <td
                          style={{
                            padding: '10px 13px',
                            fontSize: 12,
                            color: '#888',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {new Date(entry.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          <br />
                          <span style={{ fontSize: 11 }}>
                            {new Date(entry.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td style={{ padding: '10px 13px' }}>
                          <Badge type={entry.type} />
                        </td>
                        <td
                          style={{
                            padding: '10px 13px',
                            fontWeight: 600,
                            fontFamily: "'Playfair Display',serif",
                          }}
                        >
                          {entry.item_name}
                        </td>
                        <td style={{ padding: '10px 13px', fontWeight: 700 }}>
                          {entry.qty} {entry.unit}
                        </td>
                        <td
                          style={{
                            padding: '10px 13px',
                            fontSize: 13,
                            color: '#555',
                          }}
                        >
                          {entry.scout || '—'}
                        </td>
                        <td
                          style={{
                            padding: '10px 13px',
                            fontSize: 13,
                            color: '#555',
                          }}
                        >
                          {entry.event || '—'}
                        </td>
                        <td
                          style={{
                            padding: '10px 13px',
                            fontSize: 12,
                            color: '#888',
                            maxWidth: 160,
                          }}
                        >
                          {entry.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* -- CATEGORIES TAB -- */}
        {activeTab === "categories" && (
          <>
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              marginBottom: 16 
            }}>Categories</h3>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input 
                placeholder="New category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory(newCategory.trim())}
                style={{ ...inputStyle, flex: 1 }} />
                <button 
                  onClick={async () => {
                    if (newCategory.trim()) {
                      await handleAddCategory(newCategory.trim());
                      setNewCategory('');
                    }
                  }}
                  style={{
                    padding: "9px 16px",
                    background: ACCENT,
                    color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" 
                  }}>
                  + Add
                </button>
            </div>

            {categories.map((cat, i) => (
              <div key={cat.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: i < categories.length - 1 ? "1px solid #f0ece4" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{cat.name}</span>
                  {cat.protected && (
                    <span style={{ fontSize: 11, background: "#f5f0e8", color: "#888", borderRadius: 6, padding: "2px 8px" }}>protected</span>
                  )}
                </div>
                {!cat.protected && (
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    style={{ padding: "5px 12px", background: "#fce4ec", color: "#c62828", border: "none", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 12 }}>
                    Remove
                  </button>
                )}
              </div>
            ))}

            <div style={{ 
              background: "#fff", 
              borderRadius: 14, 
              border: "1px solid #e8e0d4", 
              overflow: "hidden" }}>
              {categories.map((cat, i) => (
                <div key={cat.id} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  padding: "12px 18px", 
                  borderBottom: i < categories.length - 1 ? "1px solid #f0ece4" : "none" }}>
                  <span style={{ fontWeight: 600 }}>{cat.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    style={{ 
                      padding: "5px 12px", 
                      background: "#fce4ec", 
                      color: "#c62828", 
                      border: "none", 
                      borderRadius: 7, 
                      fontWeight: 600, 
                      cursor: "pointer", 
                      fontSize: 12 }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>

          </>
        )
      }
      </main>

      {/* MODALS */}
      {modal?.type === "checkout" && (
        <CheckOutModal item={modal.item} groups={groups}
          onClose={() => setModal(null)}
          onConfirm={d => handleCheckOut(modal.item, d)} />
      )}
      {modal?.type === "checkin" && (
        <CheckInModal item={modal.item}
          openTransactions={transactions.filter(t => t.itemId === modal.item.id)}
          onClose={() => setModal(null)}
          onConfirm={d => handleCheckIn(modal.item, d)} />
      )}
      {modal?.type === 'writeoff' && (
        <WriteOffModal
          item={modal.item}
          onClose={() => setModal(null)}
          onConfirm={(d) => handleWriteOff(modal.item, d)}
        />
      )}
      {modal?.type === 'addItem' && (
        <AddItemModal 
          onClose={() => setModal(null)} 
          onAdd={handleAddItem} 
          categories={categories} />
      )}
      {modal?.type === 'buyMore' && (
        <BuyMoreModal
          item={modal.item}
          onClose={() => setModal(null)}
          onConfirm={(d) => handleBuyMore(modal.item, d)}
        />
      )}
      {modal?.type === 'removeItem' && (
        <RemoveItemModal
          item={modal.item}
          onClose={() => setModal(null)}
          onConfirm={(r) => handleRemoveItem(modal.item, r)}
        />
      )}
      {modal?.type === 'addMember' && (
        <AddMemberModal
          onClose={() => setModal(null)}
          onAdd={handleAddMember}
        />
      )}
      {modal?.type === 'editMember' && (
        <AddMemberModal
          member={modal.member}
          onClose={() => setModal(null)}
          onEdit={handleEditMember} />
      )}
      {modal?.type === 'newGroup' && (
        <GroupModal
          availableMembers={members}
          onClose={() => setModal(null)}
          onSave={(data) => handleSaveGroup(data, null)}
        />
      )}
      {modal?.type === 'editGroup' && (
        <GroupModal
          group={modal.group}
          availableMembers={members}
          onClose={() => setModal(null)}
          onSave={(data) => handleSaveGroup(data, modal.group.id)}
        />
      )}
      {modal?.type === 'groupDetail' && (
        <GroupDetailModal
          group={modal.group}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: 'editGroup', group: modal.group })}
        />
      )}
    </div>
  );
}
