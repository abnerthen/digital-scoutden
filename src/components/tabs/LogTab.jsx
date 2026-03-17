import React from 'react'
import Badge from '../elements/Badge'

export default function LogTab({ log }) {
  return (
    <div style={{ 
        background: "#fff", 
        borderRadius: 14, 
        border: "1px solid #e8e0d4", 
        overflow: "hidden" }}>
      {log.length === 0 ? (
        <p style={{ textAlign: "center", color: "#bbb", padding: 48, fontStyle: "italic" }}>No movements recorded yet.</p>
        ) : (
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                <tr
                    style={{
                    background: '#f5f0e8',
                    borderBottom: '2px solid #e0d8cc',}}>
                        {[
                        'Time',
                        'Type',
                        'Item',
                        'Qty',
                        'Scout / Group',
                        'Event',
                        'Notes',
                        ].map((h) => (
                        <th
                            key={h}
                            style={{
                            padding: '11px 13px',
                            textAlign: 'left',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: 0.7,
                            color: '#888',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            }}
                        >
                            {h}
                        </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {log.map((entry, i) => (
                        <tr
                        key={entry.id}
                        style={{
                            borderBottom: '1px solid #f0ece4',
                            background: i % 2 === 0 ? '#fff' : '#fdfaf6',
                        }}
                        >
                        <td
                            style={{
                            padding: '10px 13px',
                            fontSize: 12,
                            color: '#888',
                            whiteSpace: 'nowrap',
                            }}
                        >
                            {new Date(entry.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            })}
                            <br />
                            <span style={{ fontSize: 11 }}>
                            {new Date(entry.created_at).toLocaleDateString()}
                            </span>
                        </td>
                        <td style={{ padding: '10px 13px' }}>
                            <Badge type={entry.type} />
                        </td>
                        <td
                            style={{
                            padding: '10px 13px',
                            fontWeight: 600,
                            fontFamily: "'Playfair Display',serif",
                            }}
                        >
                            {entry.item_name}
                        </td>
                        <td style={{ padding: '10px 13px', fontWeight: 700 }}>
                            {entry.qty} {entry.unit}
                        </td>
                        <td
                            style={{
                            padding: '10px 13px',
                            fontSize: 13,
                            color: '#555',
                            }}
                        >
                            {entry.scout || entry.requester_name ||'—'}
                        </td>
                        <td
                            style={{
                            padding: '10px 13px',
                            fontSize: 13,
                            color: '#555',
                            }}
                        >
                            {entry.event || '—'}
                        </td>
                        <td
                            style={{
                            padding: '10px 13px',
                            fontSize: 12,
                            color: '#888',
                            maxWidth: 160,
                            }}
                        >
                            {entry.notes || '—'}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
        )
        }
    </div>
  )
}