import React, { useState, useEffect } from 'react';
import Overlay from '../elements/Overlay';
import { labelStyle, inputStyle, btnBase, ACCENT, ACCENT2, DARK, modalTitleStyle, attnBoxStyle } from '../../constants';
import { CloseButton } from '../elements/buttons';
import MemberSelect from '../elements/MemberSelect';
import QMSelect from '../elements/QMSelect';
import { getMemberById } from '../../lib/members';

export default function CheckInModal({ item, openTransactions, members, onClose, onConfirm }) {
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
  const [returnerId, setReturnerId] = useState("");
  const [checkerId, setCheckerId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [condition, setCondition] = useState("Good");
  const [mode, setMode] = useState(openTransactions.length > 0 ? "return" : "delivery");
  const isPendingDelivery = mode === "delivery";
  const selectedTx = openTransactions.find(t => t.id === selectedTxId);
  const [requesterName, setRequesterName] = useState("");

  useEffect(() => {
    async function fetchData() {if (selectedTx?.requester_id) {
      await getMemberById(selectedTx.requester_id)
        .then(member => setRequesterName(member.full_name))
        .catch(err => console.error(`Failed to fetch requester name for ID ${selectedTx.requester_id}:`, err));
    }};
    fetchData();
  }, [selectedTx?.requester_id]);

  return (
    <Overlay wide>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 16 }}>
        <h2 style={modalTitleStyle}>
            {isPendingDelivery ? "▲ Receive Delivery" : "▲ Check In"}: {item.name}</h2>
        <CloseButton onClick={onClose} />
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
              value={returnerId}
              onChange={setReturnerId}
              members={members.filter(m => m.active && m.role != 'scout')}
              label='Received By (Committee Member)'
            />
            <MemberSelect 
              value={checkerId} 
              onChange={setCheckerId} 
              members={members.filter(m => ["quartermaster", "assistant_qm"].includes(m.role))} 
              label="Checked by (QM on duty)"
              />
          </div>

          <label style={labelStyle}>Remarks</label>
          <textarea rows={2} placeholder="Delivery notes, supplier reference…" value={remarks} onChange={e => setRemarks(e.target.value)} style={{ ...inputStyle, resize: "vertical" }} />

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={onClose} style={btnBase}>Cancel</button>
            <button
              disabled={!returnerId || !checkerId}
              onClick={() => onConfirm({ 
                txId: null, 
                qty, 
                groupId: null, 
                groupName: null, 
                returnerId, 
                checkerId, 
                condition: "Good", 
                remarks, 
                isPendingDelivery: true })}
              style={{ ...btnBase, flex: 2, background: returnerId && checkerId ? ACCENT : "#eee", color: returnerId && checkerId ? "#fff" : "#aaa", cursor: returnerId && checkerId ? "pointer" : "not-allowed" }}>
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
                    <strong>{requesterName}</strong>
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

          <div style={{ 
            ...attnBoxStyle, 
            margin: "8px 0" }}>
            Both <strong>Returner</strong> and <strong>Checker</strong> must be filled for every return.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MemberSelect
              value={returnerId}
              onChange={setReturnerId}
              members={members}
              label='Returned By*'
            />
            <QMSelect 
            value={checkerId} 
              onChange={setCheckerId} 
              members={members} 
              label='Checked By*' />
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
            <button onClick={onClose} style={btnBase}>Cancel</button>
            <button
              disabled={!returnerId || !checkerId || !selectedTxId}
              onClick={() => onConfirm({ 
                txId: selectedTxId, 
                qty: selectedTx?.qty || 1, 
                groupId: selectedTx?.group_id, 
                groupName: selectedTx?.group_id, 
                returnerId, 
                checkerId, 
                condition, 
                remarks, 
                isPendingDelivery: false })}
              style={{ ...btnBase, 
                flex: 2, 
                background: returnerId && checkerId ? ACCENT : "#eee", 
                color: returnerId && checkerId ? "#fff" : "#aaa", 
                cursor: returnerId && checkerId ? "pointer" : "not-allowed" }}>
              Confirm Return
            </button>
          </div>
        </>
      )}
    </Overlay>
  );
}