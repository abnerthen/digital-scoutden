import React from 'react';
import { labelStyle, inputStyle } from '../constants';

export default function QMSelect({ value, onChange, members, label = "Requested by" }) {
  const qmMembers = members.filter(m => 
    !(m.role === "scouter") && m.active
  );
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
        <option value="">Select a member</option>
        {qmMembers.map(m => (
          <option key={m.id} value={m.full_name}>
            {m.full_name}{m.role != 'scout' ? ` (${m.role.replace('_', ' ')})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}