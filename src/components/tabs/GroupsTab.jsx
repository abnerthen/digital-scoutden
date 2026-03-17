import React from "react";
import { ACCENT, DARK } from "../../constants";

export default function GroupsTab( { groups, members, onAddGroup, onGroupDetail }) {
    return (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
              }}
            >
              <p style={{ margin: 0, color: '#777', fontSize: 14 }}>
                Manage patrols and assign item responsibility to groups.
              </p>
              <button
                onClick={onAddGroup}
                style={{
                  padding: '8px 16px',
                  background: ACCENT,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                👥 New Group
              </button>
            </div>

            {groups.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#bbb',
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
                <p style={{ fontStyle: 'italic', fontSize: 15 }}>
                  No groups yet. Create a patrol or collective to track item
                  responsibility.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
                  gap: 14,
                }}
              >
                {groups.map((group) => {
                  const out = group.checkouts || [];
                  const group_members = group.members;
                  const leader = members.find((m) => m.is_leader);
                  return (
                    <div
                      key={group.id}
                      onClick={() => onGroupDetail(group)}
                      style={{
                        background: '#fff',
                        borderRadius: 14,
                        border: '1px solid #e8e0d4',
                        padding: '16px 18px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = 'translateY(-2px)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = '')
                      }
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <h3
                          style={{
                            margin: '0 0 4px',
                            fontFamily: "'Playfair Display',serif",
                            fontSize: 17,
                          }}
                        >
                          {group.name}
                        </h3>
                        <span
                          style={{
                            fontSize: 11,
                            background:
                              group.type === 'led' ? '#fff9c4' : '#e3f2fd',
                            color: group.type === 'led' ? '#f57f17' : '#1565c0',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontWeight: 700,
                          }}
                        >
                          {group.type === 'led' ? '👑 Led' : '🤝 Collective'}
                        </span>
                      </div>
                      {group.type === 'led' && leader && (
                        <p
                          style={{
                            margin: '0 0 8px',
                            fontSize: 12,
                            color: '#777',
                          }}
                        >
                          Leader: <strong>{leader.name}</strong>
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontFamily: "'Playfair Display',serif",
                              fontSize: 20,
                            }}
                          >
                            {(group_members || []).length}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: '#888',
                              textTransform: 'uppercase',
                            }}
                          >
                            Members
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontFamily: "'Playfair Display',serif",
                              fontSize: 20,
                              color: out.length > 0 ? '#e65100' : DARK,
                            }}
                          >
                            {out.length}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: '#888',
                              textTransform: 'uppercase',
                            }}
                          >
                            Items Out
                          </div>
                        </div>
                      </div>
                      {out.length > 0 && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: '7px 10px',
                            background: '#fff3e0',
                            borderRadius: 8,
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              color: '#e65100',
                              fontWeight: 700,
                            }}
                          >
                            Outstanding: {out.map((c) => c.itemName).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )
}