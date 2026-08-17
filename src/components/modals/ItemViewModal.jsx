import React, { useState } from 'react';
import { ACCENT, labelStyle, inputStyle, btnBase, modalTitleStyle, DARK } from '../../constants';
import { CloseButton } from '../elements/buttons';
import Overlay from '../elements/Overlay';
import Badge from '../elements/Badge';
import StoreroomMap from '../elements/StoreroomMap';

export default function ItemViewModal({ onClose, item, log, transactions, locations = [], onSaveNotes, onSaveLocation }) {
  // Hooks must run unconditionally, so they come before the early return below
  const [editingNotes, setEditingNotes] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!item) return null;

  const startEditing = () => {
    setDraft(item.notes || '');
    setError(null);
    setEditingNotes(true);
  };

  const saveNotes = async () => {
    setSaving(true);
    setError(null);
    try {
      // notes is nullable — store empty input as null rather than ''
      await onSaveNotes(item.id, draft.trim() || null);
      setEditingNotes(false);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

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
        <h2 style={modalTitleStyle}>👁️ Item Details</h2>
        <CloseButton onClick={onClose} />
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {item.image_url || item.image ? (
          <img
            src={item.image_url || item.image}
            alt={item.name}
            style={{
              width: 120,
              height: 120,
              objectFit: 'cover',
              borderRadius: 12,
              border: '1px solid #ddd',
              filter: item.removed ? 'grayscale(60%)' : 'none',
            }}
          />
        ) : (
          <div
            style={{
              width: 120,
              height: 120,
              background: '#eee',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              color: '#ccc',
              flexShrink: 0
            }}
          >
            📦
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: '0 0 6px',
              fontFamily: "'Playfair Display',serif",
              fontSize: 22,
              color: item.removed ? '#aaa' : DARK,
              textDecoration: item.removed ? 'line-through' : 'none',
              wordBreak: 'break-word',
            }}
          >
            {item.name}
          </h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 12,
                background: '#f0ece4',
                color: '#666',
                borderRadius: 6,
                padding: '3px 8px',
                fontWeight: 600,
              }}
            >
              {item.category}
            </span>
            {item.removed && (
              <span
                style={{
                  fontSize: 12,
                  background: '#fce4ec',
                  color: '#c62828',
                  borderRadius: 6,
                  padding: '3px 8px',
                  fontWeight: 700,
                }}
              >
                Archived
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 4,
              flexWrap: 'wrap'
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: 900,
                fontFamily: "'Playfair Display',serif",
                color: item.quantity <= 2 ? '#c62828' : ACCENT,
              }}
            >
              {item.quantity}
            </span>
            <span style={{ fontSize: 13, color: '#888' }}>
              in store
            </span>
            <span
              style={{
                fontSize: 14,
                color: '#bbb',
                margin: '0 4px',
              }}
            >
              /
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#555',
              }}
            >
              {item.total_owned}
            </span>
            <span style={{ fontSize: 13, color: '#888' }}>
              owned ({item.unit})
            </span>
          </div>

          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#888' }}>📍</span>
            {onSaveLocation ? (
              <select
                value={item.location_id || ''}
                onChange={(e) => onSaveLocation(item.id, e.target.value || null)}
                style={{ ...inputStyle, width: 'auto', padding: '5px 10px', fontSize: 13 }}
              >
                <option value="">Unassigned</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize: 13, color: item.location ? '#555' : '#aaa' }}>
                {item.location || 'Unassigned'}
              </span>
            )}
          </div>

          {item.removedReason && (
            <div style={{ marginTop: 8, color: '#c62828', fontSize: 13, fontWeight: 500 }}>
              Reason: {item.removedReason}
            </div>
          )}
        </div>
      </div>

      {locations.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ ...labelStyle, marginTop: 0 }}>Where to find it</label>
          <StoreroomMap
            locations={locations}
            highlightId={item.location_id || null}
            caption={
              item.location
                ? `${item.name} is kept in ${item.location}.`
                : 'This item has no location assigned yet.'
            }
          />
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ ...labelStyle, marginTop: 0, marginBottom: 0 }}>Notes</label>
          {onSaveNotes && !editingNotes && (
            <button
              onClick={startEditing}
              style={{
                background: 'none',
                border: 'none',
                color: ACCENT,
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              ✎ Edit
            </button>
          )}
        </div>

        {editingNotes ? (
          <>
            <textarea
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Provenance, quirks, handling instructions…"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            {error && (
              <p style={{ color: '#c62828', fontSize: 12, margin: '6px 0 0' }}>{error}</p>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                onClick={() => setEditingNotes(false)}
                disabled={saving}
                style={btnBase}
              >
                Cancel
              </button>
              <button
                onClick={saveNotes}
                disabled={saving}
                style={{
                  ...btnBase,
                  flex: 2,
                  background: saving ? '#ccc' : ACCENT,
                  color: '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving…' : 'Save Notes'}
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              padding: 12,
              background: '#f9f9f9',
              borderRadius: 8,
              fontSize: 14,
              color: item.notes ? '#555' : '#aaa',
              fontStyle: item.notes ? 'normal' : 'italic',
              whiteSpace: 'pre-wrap',
            }}
          >
            {item.notes || 'No notes yet.'}
          </div>
        )}
      </div>

      {transactions && transactions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <label style={{ ...labelStyle, marginTop: 0 }}>Current Checkouts</label>
          <div style={{ background: '#fff', border: '1px solid #e8e0d4', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f5f0e8', color: '#888', borderBottom: '1px solid #e0d8cc' }}>
                  <th style={{ padding: '8px 12px' }}>Qty</th>
                  <th style={{ padding: '8px 12px' }}>Checkout To</th>
                  <th style={{ padding: '8px 12px' }}>Event/Remarks</th>
                  <th style={{ padding: '8px 12px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f0ece4' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{t.qty}</td>
                    <td style={{ padding: '8px 12px', color: '#555' }}>{t.group_id ? "Group" : (t.requester_name || t.requester_id || '—')}</td>
                    <td style={{ padding: '8px 12px', color: '#777' }}>{t.event || t.checkout_remarks || '—'}</td>
                    <td style={{ padding: '8px 12px', color: '#888', fontSize: 12 }}>
                      {new Date(t.checked_out_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <label style={{ ...labelStyle, marginTop: 0 }}>Recent Activity (Last 5)</label>
        {log && log.length > 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e8e0d4', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f5f0e8', color: '#888', borderBottom: '1px solid #e0d8cc' }}>
                  <th style={{ padding: '8px 12px' }}>Type</th>
                  <th style={{ padding: '8px 12px' }}>Qty</th>
                  <th style={{ padding: '8px 12px' }}>By/To</th>
                  <th style={{ padding: '8px 12px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {log.slice(0, 5).map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f0ece4' }}>
                    <td style={{ padding: '8px 12px' }}><Badge type={l.type} /></td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{l.qty}</td>
                    <td style={{ padding: '8px 12px', color: '#555' }}>{l.scout || l.requester_name || l.checker_id || '—'}</td>
                    <td style={{ padding: '8px 12px', color: '#888', fontSize: 12 }}>
                      {new Date(l.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 16, textAlign: 'center', color: '#bbb', background: '#f9f9f9', borderRadius: 8, fontStyle: 'italic', fontSize: 13 }}>
            No recent activity.
          </div>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={onClose}
          style={btnBase}
        >
          Close
        </button>
      </div>
    </Overlay>
  );
}
