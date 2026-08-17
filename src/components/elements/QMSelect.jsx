import React from 'react';
import MemberSelect from './MemberSelect';

export default function QMSelect({ value, onChange, members, label = "Checked by (QM on duty)" }) {
  const qms = members.filter(m => ["quartermaster", "assistant_qm"].includes(m.role) && m.active);
  return (<MemberSelect value={value} onChange={onChange} members={qms} label={label} />)
}