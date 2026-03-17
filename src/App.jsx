import React, { useState, useRef, useEffect } from 'react';
import { BG, DARK, ACCENT, ACCENT2, ROLES, labelStyle, inputStyle, btnBase, modalTitleStyle } from './constants';
import { getItems, addItem, updateItemQuantity, archiveItem, uploadItemImage, updateItem } from './lib/items';
import { getGroups, saveGroup } from './lib/groups';
import { getLog, writeLog } from './lib/log';
import { signOut } from './lib/auth';
import { createCheckout, closeTransaction, getOpenTransactions } from './lib/transactions';
import { getMembers, addMember, deactivateMember, updateMember, restoreMember, getInactiveMembers } from './lib/members';
import { getCategories, addCategory, deleteCategory } from './lib/categories';
import troop_logo from './assets/troop_logo.png';

import Overlay from './components/Overlay';
import Badge from './components/Badge';
import QMSelect from './components/QMSelect';
import MemberSelect from './components/MemberSelect';

// import modals
import WriteOffModal from './components/modals/WriteOffModal';
import GroupDetailModal from './components/modals/GroupDetailModal';
import AddItemModal from './components/modals/AddItemModal';
import RemoveItemModal from './components/modals/RemoveItemModal'

// ─── Check-out Modal ──────────────────────────────────────────────────────────
function CheckOutModal({ item, groups, members, onClose, onConfirm }) {
  const [qty, setQty] = useState(1);
  const [qtyDisplay, setQtyDisplay] = useState("1");
  const [groupId, setGroupId] = useState("");
  const [requester, setRequester] = useState("");
  const [checker, setChecker] = useState("");
  const [event, setEvent] = useState("");
  const [remarks, setRemarks] = useState("");
  const max = item.quantity;
  const selectedGroup = groups.find(g => g.id === groupId);
  // const qmMembers = members.filter(m => ["quartermaster", "assistant_qm"].includes(m.role) && m.active);
  // console.log(qmMembers);

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
        <MemberSelect
          value={requester}
          onChange={setRequester}
          members={members}
        />
        <QMSelect
          value={checker}
          onChange={setChecker}
          members={members}
        />
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
              ? `Leader: ${selectedGroup.members.find(m => m.is_leader)?.name || "—"}`
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
          style={{ ...btnBase, 
            flex: 2, 
            background: requester.trim() && checker.trim() ? ACCENT2 : "#eee", 
            color: requester.trim() && checker.trim() ? "#fff" : "#aaa", 
            cursor: requester.trim() && checker.trim() ? "pointer" : "not-allowed" }}>
          Confirm Check Out
        </button>
      </div>
    </Overlay>
  );
}

// ─── Check-in Modal ────────────────────────────────────────────────────────────
function CheckInModal({ item, openTransactions, members, onClose, onConfirm }) {
  console.log('CheckInModal openTransactions:', openTransactions)
  const maxIn = (item.total_owned || 0) - (item.quantity || 0);
  const hasPendingDelivery = maxIn > 0 && openTransactions.length === 0 || 
    (item.total_owned || 0) > (item.quantity || 0) + openTransactions.reduce((sum, t) => sum + t.qty, 0);
  const bothAvailable = openTransactions.length > 0 && hasPendingDelivery;
  const unitsOut = openTransactions.reduce((sum, t) => sum + t.qty, 0);
  const pendingUnits = maxIn - unitsOut;
  const [qty, setQty] = useState(pendingUnits);
  const [qtyDisplay, setQtyDisplay] = useState(String(pendingUnits));
  const [selectedTxId, setSelectedTxId] = useState(openTransactions[0]?.id || "");
  const [returner, setReturner] = useState("");
  const [checker, setChecker] = useState("");
  const [remarks, setRemarks] = useState("");
  const [condition, setCondition] = useState("Good");
  const [mode, setMode] = useState(openTransactions.length > 0 ? "return" : "delivery");
  const isPendingDelivery = mode === "delivery";
  const selectedTx = openTransactions.find(t => t.id === selectedTxId);

  return (
    <Overlay wide>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={modalTitleStyle}>{isPendingDelivery ? "▲ Receive Delivery" : "▲ Check In"}: {item.name}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>✕</button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: "#f5f0e8", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>In Store</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif", color: ACCENT }}>{item.quantity}</div>
        </div>
        <div style={{ flex: 1, background: "#e8f5e9", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>
            {isPendingDelivery ? "Pending Delivery" : "Outstanding"}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif", color: (isPendingDelivery ? pendingUnits : maxIn) > 0 ? "#e65100" : DARK }}>
            {isPendingDelivery ? pendingUnits : maxIn}
          </div>
        </div>
      </div>

      {bothAvailable && (
        <div style={{ 
          display: "flex", 
          gap: 8, 
          marginBottom: 16 }}>
            {[
              { value: "return", label: "Return Checked-Out Item(s)" },
              { value: "delivery", label: "Receive Pending Delivery" },
            ].map(opt => (
              <div key={opt.value} onClick={() => setMode(opt.value)}
                style={{ 
                  flex: 1, 
                  textAlign: "center", 
                  padding: "9px 0", 
                  borderRadius: 8, 
                  cursor: "pointer", 
                  fontWeight: 700, 
                  fontSize: 13,
                  background: mode === opt.value ? "#f0f7f0" : "#f5f5f5",
                  color: mode === opt.value ? ACCENT : "#888",
                  border: `2px solid ${mode === opt.value ? "#a5d6a7" : "transparent"}`
                }}>
              {opt.label}
                </div>
        ))}
        </div>
      )}

      {isPendingDelivery ? (
        <>
          <div style={{ background: "#e3f2fd", border: "1px solid #90caf9", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#1565c0" }}>
            🚚 Receiving a pending delivery. These units were purchased but not yet received into the storeroom.
          </div>

          <label style={labelStyle}>Units to receive (max {pendingUnits})</label>
          <input
            type="number" min={1} max={pendingUnits} value={qtyDisplay}
            onChange={e => { 
              setQtyDisplay(e.target.value); 
              const n = parseInt(e.target.value); 
              if (!isNaN(n)) setQty(Math.max(1, Math.min(pendingUnits, n))); }}
            onBlur={() => setQtyDisplay(String(Math.min(qty, pendingUnits)))}
            style={inputStyle} />

          <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, padding: "10px 14px", margin: "8px 0", fontSize: 13, color: "#7a5800" }}>
            Both <strong>Receiver</strong> and <strong>Checker</strong> must be filled. 
            Purchases may only be received by <strong>Committee Members</strong>.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MemberSelect
              value={returner}
              onChange={setReturner}
              members={members.filter(m => m.active && !["scouter", "scout"].includes(m.role))}
              label='Received By (Committee Member)'
            />
            <QMSelect value={checker} onChange={setChecker} members={members} />
          </div>

          <label style={labelStyle}>Remarks</label>
          <textarea rows={2} placeholder="Delivery notes, supplier reference…" value={remarks} onChange={e => setRemarks(e.target.value)} style={{ ...inputStyle, resize: "vertical" }} />

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={onClose} style={{ ...btnBase, flex: 1, background: "#eee", color: "#555" }}>Cancel</button>
            <button
              disabled={!returner.trim() || !checker.trim()}
              onClick={() => onConfirm({ txId: null, qty, groupId: null, groupName: null, returner, checker, condition: "Good", remarks, isPendingDelivery: true })}
              style={{ ...btnBase, flex: 2, background: returner.trim() && checker.trim() ? ACCENT : "#eee", color: returner.trim() && checker.trim() ? "#fff" : "#aaa", cursor: returner.trim() && checker.trim() ? "pointer" : "not-allowed" }}>
              Receive {qty} {item.unit}
            </button>
          </div>
        </>
      ) : openTransactions.length === 0 ? (
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
            <MemberSelect
              value={returner}
              onChange={setReturner}
              members={members.filter(m => m.active && (!["scouter", "scout"].includes(m.role)))}
              label='Returned By*'
            />
            <QMSelect value={checker} onChange={setChecker} members={members} />
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
              onClick={() => onConfirm({ txId: selectedTxId, qty: selectedTx?.qty || 1, groupId: selectedTx?.group_id, groupName: selectedTx?.group_id, returner, checker, condition, remarks, isPendingDelivery: false })}
              style={{ ...btnBase, flex: 2, background: returner.trim() && checker.trim() ? ACCENT : "#eee", color: returner.trim() && checker.trim() ? "#fff" : "#aaa", cursor: returner.trim() && checker.trim() ? "pointer" : "not-allowed" }}>
              Confirm Return
            </button>
          </div>
        </>
      )}
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

// ─── Group Manager Modal ───────────────────────────────────────────────────────
function GroupModal({ group, availableMembers = [], onClose, onSave }) {
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
      is_leader: isFirst && type === "led"
    }])
    setNewMember("")
  };

  const removeMember = (id) => {
    const wasLeader = members.find((m) => m.id === id)?.is_leader;
    const updated = members.filter((m) => m.id !== id);
    if (type === 'led' && wasLeader && updated.length > 0)
      updated[0].is_leader = true;
    setMembers(updated);
  };

  const setLeader = (id) =>
    setMembers((prev) => prev.map((m) => ({ ...m, is_leader: m.id === id })));

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
                  prev.map((m) => ({ ...m, is_leader: false }))
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
          onChange={e => {
            const selectedId = e.target.value;
            if (!selectedId) return
            const selected = availableMembers.find(m => m.id === selectedId)
            if (!selected || members.find(existing => existing.member_id === selected.id)) return
            const isFirst = members.length === 0
            setMembers(prev => [...prev, {
              id: Date.now(),
              member_id: selected.id,
              name: selected.full_name,
              is_leader: isFirst && type === "led"
            }])
            setNewMember("") // reset dropdown back to placeholder
          }}
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
                background: m.is_leader && type === 'led' ? '#f0f7f0' : '#fff',
              }}
            >
              <span style={{ fontSize: 16 }}>
                {type === 'led' && m.is_leader ? '👑' : '🧑'}
              </span>
              <span style={{ flex: 1, fontWeight: 600 }}>{m.name}</span>
              {type === 'led' &&
                (m.is_leader ? (
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
              console.log("saving members:", members.map(m => ({
                name: m.name, 
                is_leader: m.is_leader,
              })))
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

// -- Member Management
function AddMemberModal({ onClose, onAdd, onEdit, member }) {
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
          disabled={!isEdit && !fullName.trim() && !email.trim()}
          onClick={handleSubmit}
          style={{ ...btnBase, flex: 2, 
            background: (!isEdit &&fullName.trim()) ?ACCENT : "#eee", 
            color: !isEdit && !fullName.trim() && !email.trim() ? "#aaa" : "#fff", 
            cursor: !isEdit && !fullName.trim() && !email.trim() ? "not-allowed" : "pointer"}}>
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
  const [newCategory, setNewCategory] = useState("");
  const [inactiveMembers, setInactiveMembers] = useState([])
  const [showInactive, setShowInactive] = useState(false)
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

  // useEffect to load inactive members when switching to members tab
  useEffect(() => {
    if (activeTab === 'members') {
      getInactiveMembers().then(setInactiveMembers)
    }
  }, [activeTab])

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
    const saved = await createCheckout(tx)
    console.log('saved tx:', saved)
    console.log('transactions after:', transactions)
    setTransactions(prev => {
      console.log('prev tx:', prev)
      const updated = [...prev, saved]
      console.log('updated tx:', updated)
      return updated
    })
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

  const handleCheckIn = async (item, { txId, qty, groupId, groupName, returner, checker, condition, remarks, isPendingDelivery }) => {
    const newQty = (item.quantity || 0) + qty;

    if (!isPendingDelivery && txId) {
      await closeTransaction(txId, {
        returner_name: returner,
        return_checker_name: checker,
        condition,
        return_remarks: remarks || null,
      })
      setTransactions(prev => prev.filter(t => t.id !== txId))
    }

    await updateItemQuantity(item.id, newQty, item.total_owned)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i))

    await addLog({
      type: 'IN',
      itemId: item.id,
      itemName: item.name,
      qty,
      unit: item.unit,
      returner: returner || null,
      checker: checker || null,
      event: isPendingDelivery ? 'Delivery received' : null,
      notes: isPendingDelivery ? remarks || null : `${condition}${remarks ? ' — ' + remarks : ''}`,
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
      try {
        const imageUrl = await uploadItemImage(data.imageFile, newItem.id)
        await updateItem(newItem.id, { image_url: imageUrl })
        newItem.image_url = imageUrl
      } catch (err) {
        console.error("Image upload failed:", err)
      }
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
    const { id, checkouts, ...groupData } = data
    const saved = await saveGroup({ 
      ...groupData, 
      id: editId || undefined })
    if (editId) {
      setGroups(prev => prev.map(g => g.id === editId 
        ? { ...saved,
          checkouts: g.checkouts || []
      } : g))
    } else {
      setGroups(prev => [...prev, saved])
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

  const handleRestoreMember = async (id) => {
    const restored = await restoreMember(id)
    setMembers(prev => [...prev, restored])
    setInactiveMembers(prev => prev.filter(m => m.id !== id))
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
          <img 
            src={troop_logo}
            alt="Troop Logo"
            style={{ width: 40, height: 40, objectFit: 'contain'}}
          />
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
              {displayItems.map((item) => {
                const unitsAccountedFor = (item.quantity || 0) + transactions
                  .filter(t => t.item_id === item.id && t.returned_at === null)
                  .reduce((sum, t) => sum + t.qty, 0)

                const hasPendingDelivery = (item.total_owned || 0) > unitsAccountedFor
                const hasOpenTransactions = transactions.some(t => t.item_id === item.id && t.returned_at === null)
                const canCheckIn = hasOpenTransactions || hasPendingDelivery
                console.log(`item ${item.name} — quantity: ${item.quantity}, total_owned: ${item.total_owned}, hasPendingDelivery: ${hasPendingDelivery}, canCheckIn: ${canCheckIn}`)
              return (
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
                            disabled={!canCheckIn}
                            title={!canCheckIn
                              ? "No open checkouts for this item"
                              : "Return units to store"
                            }
                            style={{
                              flex: 1,
                              padding: '7px 0',
                              background:
                                !canCheckIn
                                  ? '#eee'
                                  : '#e8f5e9',
                              color:
                                !canCheckIn
                                  ? '#ccc'
                                  : '#2e7d32',
                              border: 'none',
                              borderRadius: 7,
                              fontWeight: 700,
                              cursor:
                                !hasOpenTransactions
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
              )}
              )}
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
                  const group_members = group.members;
                  const leader = members.find((m) => m.is_leader);
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
                            {(group_members || []).length}
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
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", marginBottom: 18 }}>
              <p style={{ 
                margin: 0, 
                color: "#777", 
                fontSize: 14 
                }}>Manage troop members and their roles.</p>
              <div style={{
                display: "flex",
                gap: 8,
              }}>
                <button onClick={() => setShowInactive(v => !v)}
                  style={{
                    padding: "8px 14px",
                    background: showInactive 
                      ? "#fce4ec"
                      : "#f5f0e8",
                    color: showInactive
                      ? "#c62828"
                      : "#666",
                    border: showInactive
                      ? "1.5px solid #ef9a9a"
                      : "1.5px solid #ddd",
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 13,
                  }}>{showInactive ? "👁 Viewing Removed" : "🗑️ Show Removed"}
                </button>
                <button onClick={() => setModal({ type: "addMember" })}
                  style={{ 
                    padding: "8px 16px", 
                    background: ACCENT, 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: 8, 
                    fontWeight: 700, 
                    cursor: "pointer", 
                    fontSize: 13 }}>
                  👤 Add Member
                </button>
              </div>
            </div>

            {showInactive ? (
              <>
                {inactiveMembers.length === 0 ? (
                  <div style={{ 
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#bbb"
                  }}>
                    <p style={{ fontStyle: "italic" }}>No removed members.</p>
                  </div>
            ) : (
              <div style={{ 
                background: "#fff",
                borderRadius: 14,
                border: "1px solid #e8e0d4",
                overflow: "hidden" 
              }}>
                {inactiveMembers.map((member, i) => (
                  <div key={member.id} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 18px",
                    borderBottom: i < inactiveMembers.length - 1 
                      ? "1px solid #f0ece4"
                      : "none",
                    opacity: 0.7,
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "#e0e0e0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}>
                      🧑
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 700,
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 15,
                        textDecoration: "line-through",
                        color: "#aaa",
                      }}>{member.full_name}</div>
                      <div style={{
                        fontSize: 12,
                        color: "#aaa",
                        marginTop: 2
                      }}>
                        {member.email || "No email"} · {ROLES.find(r => r.value === member.role)?.label || member.role}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRestoreMember(member.id)} 
                      style={{
                        padding: "6px 12px",
                        background: "#e3f2fd",
                        color: "#2e7d32",
                        border: "none",
                        borderRadius: 7,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 12,
                      }}> 
                      ↩ Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          members.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "60px 20px", 
              color: "#bbb" }}>
              <div style={{ 
                fontSize: 48, 
                marginBottom: 12 }}>👤</div>
              <p style={{ 
                fontStyle: "italic", 
                fontSize: 15 }}>No members yet. Add scouts and committee members.</p>
            </div>
          ) : (
              <div style={{ 
                background: "#fff", 
                borderRadius: 14, 
                border: "1px solid #e8e0d4", 
                overflow: "hidden" }}>
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
          )
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
                onChange={e => setNewCategory(e.target.value)}
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

            <div style={{ 
              background: "#fff", 
              borderRadius: 14, 
              border: "1px solid #e8e0d4", 
              overflow: "hidden" }}>
              {categories.map((cat, i) => (
                <div 
                  key={cat.id} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    padding: "12px 18px", 
                    borderBottom: i < categories.length - 1 ? "1px solid #f0ece4" : "none" 
                  }}
                  >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{cat.name}</span>
                    {cat.protected && (
                      <span style={{ 
                        fontSize: 11, 
                        color: "#1565c0", 
                        background: "#e3f2fd", 
                        padding: "2px 6px", 
                        borderRadius: 6 
                        }}>Protected</span>
                      )}
                  </div>
                  {!cat.protected && (
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
                  )}
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
          members={members}
          onClose={() => setModal(null)}
          onConfirm={d => handleCheckOut(modal.item, d)} />
      )}
      {modal?.type === "checkin" && (
        <>
        {console.log('passing OpenTransactions:', transactions.filter(t => t.item_id === modal.item.id && t.returned_at === null))}
        <CheckInModal item={modal.item}
          openTransactions={transactions.filter(t => 
            t.item_id === modal.item.id && t.returned_at === null)}
          members={members}
          onClose={() => setModal(null)}
          onConfirm={d => handleCheckIn(modal.item, d)} />
        </>
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
