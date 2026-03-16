const ACCENT = '#2e7d32';
const ACCENT2 = '#ff8f00';
const BG = '#f5f0e8';
const DARK = '#1a1a1a';

const ROLES = [
  { value: "scout", label: "Scout" },
  { value: "troop_leader", label: "Troop Leader" },
  { value: "assistant_leader", label: "Assistant Troop Leader" },
  { value: "quartermaster", label: "Quartermaster" },
  { value: "assistant_qm", label: "Assistant Quartermaster" },
  { value: "committee_member", label: "Committee Member" },
  { value: "scouter", label: "Scouter" },
]

// ─── Shared styles
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

const modalTitleStyle = { 
  margin: 0, 
  fontFamily: "'Playfair Display',serif", 
  fontSize: 20,
  color: "#1b5e20"
};