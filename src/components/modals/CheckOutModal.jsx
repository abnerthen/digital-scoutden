import React, { useState } from 'react';
import { ACCENT, ACCENT2, attnBoxStyle, inputStyle, labelStyle, btnBase, modalTitleStyle } from '../../constants';
import { CloseButton } from '../elements/buttons';
import Overlay from '../elements/Overlay';
import MemberSelect from '../elements/MemberSelect';
import QMSelect from '../elements/QMSelect';

const StatBox = ({ label, value, color }) => (
    <div style={{ 
        flex: 1, 
        background: "#f5f0e8", 
        borderRadius: 8, 
        padding: "8px 12px", 
        textAlign: "center" 
    }}>
    <div style={{ 
        fontSize: 11, 
        color: "#888", 
        textTransform: "uppercase", 
        letterSpacing: 0.5 
    }}>{label}</div>
    <div style={{ 
        fontSize: 22, 
        fontWeight: 700, 
        fontFamily: "'Playfair Display',serif",
        color: color || 'inherit'
    }}>{value}</div>
  </div>
);

export default function CheckOutModal({ item, groups, members, onClose, onConfirm }) {
  const [qty, setQty] = useState(1);
  const [qtyDisplay, setQtyDisplay] = useState("1");
  const [groupId, setGroupId] = useState("");
  const [requesterId, setRequesterId] = useState("");
  const [checkerId, setCheckerId] = useState("");
  const [event, setEvent] = useState("");
  const [remarks, setRemarks] = useState("");
  const max = item.quantity;
  const selectedGroup = groups.find(g => g.id === groupId);

  return (
    <Overlay wide>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 16 }}>
        <h2 style={modalTitleStyle}>▼ Check Out: {item.name}</h2>
        <CloseButton onClick={onClose} />
      </div>

      <div style={{ 
        display: "flex", 
        gap: 10, 
        marginBottom: 16 }}>
        <StatBox label="In Store" value={item.quantity} color={ACCENT} />
        <StatBox label="Total Owned" value={item.total_owned} />
      </div>

      <div style={attnBoxStyle}>
        Both <strong>Requester</strong> and <strong>Checker</strong> must be filled for every checkout.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <MemberSelect
          value={requesterId}
          onChange={setRequesterId}
          members={members}
        />
        <MemberSelect
          value={checkerId}
          onChange={setCheckerId}
          members={members.filter(m => ["quartermaster", "assistant_qm"].includes(m.role))}
          label="Checked by (QM on duty)"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Quantity (max {max})</label>
          <input type="number" min={1} max={max} value={qtyDisplay}
            onChange={e => { 
                setQtyDisplay(e.target.value); 
                const n = parseInt(e.target.value); 
                if (!isNaN(n)) setQty(Math.max(1, Math.min(max, n))); 
            }}
            onBlur={() => setQtyDisplay(String(qty))}
            style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Event / Activity</label>
          <input 
            placeholder="e.g. Leading Airman Camp" 
            value={event} 
            onChange={e => setEvent(e.target.value)} 
            style={inputStyle} />
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
        <div style={{ 
            background: "#f0f7f0", 
            border: "1px solid #c8e6c9", 
            borderRadius: 8, 
            padding: "10px 14px", 
            marginTop: 8, 
            fontSize: 13 }}>
          <strong style={{ color: ACCENT }}>
            {selectedGroup.type === "led"
              ? `Leader: ${selectedGroup.members.find(m => m.is_leader)?.name || "—"}`
              : `Collective (${selectedGroup.members.length} members)`}
          </strong>
          <p style={{ margin: "3px 0 0", color: "#555" }}>{selectedGroup.members.map(m => m.name).join(", ")}</p>
        </div>
      )}

      <label style={labelStyle}>Remarks (condition on checkout)</label>
      <textarea 
        rows={2} 
        placeholder="e.g. Minor tear on tent fly noted before checkout…" 
        value={remarks} 
        onChange={e => setRemarks(e.target.value)} 
        style={{ ...inputStyle, resize: "vertical" }} />

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={onClose} style={btnBase}>Cancel</button>
        <button
          disabled={!requesterId || !checkerId}
          onClick={() => onConfirm({ 
            qty, 
            groupId: groupId, 
            group_name: selectedGroup?.name || requesterId, 
            requester: requesterId, 
            checker: checkerId, 
            event, 
            remarks })}
          style={{ ...btnBase, 
            flex: 2, 
            background: requesterId && checkerId ? ACCENT2 : "#eee", 
            color: requesterId && checkerId ? "#fff" : "#aaa", 
            cursor: requesterId && checkerId ? "pointer" : "not-allowed" }}>
          Confirm Check Out
        </button>
      </div>
    </Overlay>
  );
}