import { useState } from 'react';
import { ACCENT, modalTitleStyle, labelStyle, inputStyle, btnBase } from '../../constants';
import Overlay from '../elements/Overlay';
import { CloseButton } from '../elements/buttons';
import MemberSelect from '../elements/MemberSelect';

// ─── Group Manager Modal ───────────────────────────────────────────────────────
export default function GroupModal({ group, availableMembers = [], onClose, onSave }) {
  const isEdit = !!group;
  const [name, setName] = useState(group?.name || '');
  const [type, setType] = useState(group?.type || 'led');
  const [members, setMembers] = useState(group?.members || []);
  const [newMember, setNewMember] = useState('');

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
        <CloseButton onClick={onClose} />
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

      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 10 
        }}>
        <MemberSelect
            value={newMember}
            onChange={(selectedId) => {
                if (!selectedId) return
                const selected = availableMembers
                    .find(m => m.id === selectedId);
                if (!selected || members.find(existing => existing.member_id === selected.id)) return;
                const isFirst = members.length === 0;
                setMembers(prev => [...prev, {
                    id: Date.now(),
                    member_id: selected.id,
                    name: selected.full_name,
                    is_leader: isFirst && type === "led"
                }
                ]);
                setNewMember("");
            }}
            members={availableMembers}
            excludeIds={members.map(m => m.member_id)}
            label=""
        />
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