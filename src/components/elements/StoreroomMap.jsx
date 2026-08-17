import React from 'react';
import { ACCENT } from '../../constants';
import { GRID_COLUMNS, gridRows } from '../../lib/selectors';

const CELL = 48;
const GAP = 4;

/**
 * Schematic top-down plan of the storeroom, optionally highlighting one
 * section. Locations carry their own rectangle via grid_x/y/w/h.
 */
export default function StoreroomMap({ locations = [], highlightId = null, caption }) {
  if (locations.length === 0) {
    return (
      <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: 13, margin: 0 }}>
        No locations defined yet.
      </p>
    )
  }

  const rows = gridRows(locations)
  const width = GRID_COLUMNS * CELL
  const height = rows * CELL

  return (
    <div>
      <svg
        role="img"
        aria-label={
          highlightId
            ? `Storeroom map, highlighting ${locations.find(l => l.id === highlightId)?.name || 'a section'}`
            : 'Storeroom map'
        }
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', maxWidth: width * 1.6, display: 'block' }}
      >
        {/* room outline */}
        <rect
          x={1} y={1} width={width - 2} height={height - 2}
          fill="#faf7f2" stroke="#e0d8cc" strokeWidth={2} rx={6}
        />
        {locations.map((l) => {
          const isHighlighted = l.id === highlightId
          const x = (l.grid_x || 0) * CELL + GAP
          const y = (l.grid_y || 0) * CELL + GAP
          const w = (l.grid_w || 1) * CELL - GAP * 2
          const h = (l.grid_h || 1) * CELL - GAP * 2
          return (
            <g key={l.id}>
              <rect
                x={x} y={y} width={w} height={h} rx={5}
                fill={isHighlighted ? '#e8f5e9' : '#fff'}
                stroke={isHighlighted ? ACCENT : '#ddd'}
                strokeWidth={isHighlighted ? 2.5 : 1.5}
              />
              <text
                x={x + w / 2} y={y + h / 2}
                textAnchor="middle" dominantBaseline="middle"
                style={{
                  fontSize: 9,
                  fontWeight: isHighlighted ? 700 : 500,
                  fill: isHighlighted ? '#1b5e20' : '#888',
                  fontFamily: 'inherit',
                }}
              >
                {/* keep long names inside their rectangle */}
                {l.name.length > w / 5 ? `${l.name.slice(0, Math.floor(w / 5))}…` : l.name}
              </text>
            </g>
          )
        })}
      </svg>
      {caption && (
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#888' }}>{caption}</p>
      )}
    </div>
  )
}
