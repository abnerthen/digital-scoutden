import React, { useState } from 'react';
import { ACCENT, labelStyle, inputStyle, btnBase, modalTitleStyle, ROLES } from '../../constants';
import Overlay from '../elements/Overlay';
import { CloseButton } from '../elements/buttons';

// -- Member Management
export default function AddMemberModal({ onClose, onAdd, onEdit, member }) {
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