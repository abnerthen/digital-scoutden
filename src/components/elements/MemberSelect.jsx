import React from 'react';
import { labelStyle, inputStyle, ROLES } from '../../constants';

const ROLE_LABELS = Object.fromEntries(
  ROLES.map(role => [role.value, role.label])
);

export default function MemberSelect({ 
  value, onChange, 
  members, excludeIds = [],label = "Requested by" }) {
  const availableMembers = members.filter(m => 
    !(m.role === "scouter") 
    && m.active 
    && !excludeIds.includes(m.id)
  )
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        style={inputStyle}>
        <option value="">Select a member</option>
        {availableMembers.map(m => (
          <option key={m.id} value={m.id}>
            {m.full_name}
            {m.role != 'scout' ? ` (${ROLE_LABELS[m.role]})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}