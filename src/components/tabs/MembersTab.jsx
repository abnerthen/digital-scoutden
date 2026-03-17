import React from "react";
import { ACCENT, ROLES, ACCENT2 } from "../../constants";

export default function MembersTab({ members, inactiveMembers, showInactive, onToggleInactive, 
    onAddMember, onEditMember, onRestore, onDeactivate }) {

  return (
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
                <button onClick={onToggleInactive}
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
                <button onClick={onAddMember}
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
                      onClick={() => onRestore(member.id)} 
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
                  <div key={member.id} style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 14, 
                    padding: "14px 18px", 
                    borderBottom: i < members.length - 1 ? "1px solid #f0ece4" : "none" }}>
                    <div style={{ 
                      width: 40, 
                      height: 40, 
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
                    onClick={() => onEditMember(member)}
                    style={{ padding: "6px 12px", background: "#e3f2fd", color: "#1565c0", border: "none", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 12, marginRight: 6 }}>
                    ✎ Edit
                  </button>
                  <button
                    onClick={() => onDeactivate(member.id)}
                    style={{ padding: "6px 12px", background: "#fce4ec", color: "#c62828", border: "none", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 12 }}>
                    Remove
                  </button>
                  </div>
                ))}
              </div>
          )
        )}
      </>
  )
}