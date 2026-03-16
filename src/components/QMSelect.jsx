import React from 'react';

export default function QMSelect({ value, onChange, members, label = "Checked by (QM on duty)" }) {
  const qmMembers = members.filter(m => 
    ["quartermaster", "assistant_qm"].includes(m.role) && m.active
  );
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
        <option value="">Select a Quartermaster</option>
        {qmMembers.map(m => (
          <option key={m.id} value={m.full_name}>
            {m.full_name}
          </option>
        ))}
      </select>
    </div>
  )
}