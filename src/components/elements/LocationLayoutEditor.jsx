import React, { useState, useRef } from 'react';
import { ACCENT } from '../../constants';
import { GRID_COLUMNS, gridRows, sectionRect, canPlaceSection } from '../../lib/selectors';

const CELL = 56;
const GAP = 4;
const HANDLE = 12;

/**
 * Drag-to-arrange plan of the storeroom.
 *
 * Sections are moved by dragging and resized from the corner handle. Both are
 * also fully keyboard operable — focus a section and use the arrow keys, with
 * shift to resize — so arranging the room does not require a mouse.
 *
 * A move that would leave the grid or land on another section is rejected, so
 * the layout cannot be dragged into an incoherent state.
 */
export default function LocationLayoutEditor({ locations = [], onUpdateLocation }) {
  const svgRef = useRef(null);
  const [drag, setDrag] = useState(null);      // { id, mode, originRect, startCell }
  const [preview, setPreview] = useState(null); // { id, rect, valid }
  const [selectedId, setSelectedId] = useState(null);

  if (locations.length === 0) {
    return (
      <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: 13, margin: '0 0 16px' }}>
        Add a location below and it will appear here to arrange.
      </p>
    );
  }

  // One spare row so a section can be dragged into new space at the bottom.
  const rows = gridRows(locations) + 1;
  const width = GRID_COLUMNS * CELL;
  const height = rows * CELL;

  /** Pointer position in whole grid cells. */
  const cellFromEvent = (e) => {
    const box = svgRef.current.getBoundingClientRect();
    const scale = width / box.width;
    return {
      cx: Math.floor(((e.clientX - box.left) * scale) / CELL),
      cy: Math.floor(((e.clientY - box.top) * scale) / CELL),
    };
  };

  const commit = (id, rect) => {
    const current = sectionRect(locations.find(l => l.id === id));
    if (rect.x === current.x && rect.y === current.y &&
        rect.w === current.w && rect.h === current.h) return;
    onUpdateLocation(id, {
      grid_x: rect.x, grid_y: rect.y, grid_w: rect.w, grid_h: rect.h,
    });
  };

  const onPointerDown = (e, location, mode) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setSelectedId(location.id);
    setDrag({
      id: location.id,
      mode,
      originRect: sectionRect(location),
      startCell: cellFromEvent(e),
    });
  };

  const onPointerMove = (e) => {
    if (!drag) return;
    const { cx, cy } = cellFromEvent(e);
    const dx = cx - drag.startCell.cx;
    const dy = cy - drag.startCell.cy;
    const o = drag.originRect;

    const rect = drag.mode === 'move'
      ? { ...o, x: o.x + dx, y: o.y + dy }
      : { ...o, w: Math.max(1, o.w + dx), h: Math.max(1, o.h + dy) };

    setPreview({ id: drag.id, rect, valid: canPlaceSection(rect, locations, drag.id) });
  };

  const onPointerUp = () => {
    if (drag && preview?.valid) commit(drag.id, preview.rect);
    setDrag(null);
    setPreview(null);
  };

  const onKeyDown = (e, location) => {
    const deltas = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    };
    const delta = deltas[e.key];
    if (!delta) return;
    e.preventDefault();

    const o = sectionRect(location);
    const [dx, dy] = delta;
    // shift resizes, otherwise move
    const rect = e.shiftKey
      ? { ...o, w: Math.max(1, o.w + dx), h: Math.max(1, o.h + dy) }
      : { ...o, x: o.x + dx, y: o.y + dy };

    if (canPlaceSection(rect, locations, location.id)) commit(location.id, rect);
  };

  const px = (rect) => ({
    x: rect.x * CELL + GAP,
    y: rect.y * CELL + GAP,
    w: rect.w * CELL - GAP * 2,
    h: rect.h * CELL - GAP * 2,
  });

  return (
    <div style={{ marginBottom: 16 }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{
          width: '100%', height: 'auto', maxWidth: width * 1.4,
          display: 'block', touchAction: 'none',
        }}
      >
        <rect x={1} y={1} width={width - 2} height={height - 2}
          fill="#faf7f2" stroke="#e0d8cc" strokeWidth={2} rx={6} />

        {/* cell guides */}
        {Array.from({ length: GRID_COLUMNS - 1 }, (_, i) => (
          <line key={`v${i}`} x1={(i + 1) * CELL} y1={0} x2={(i + 1) * CELL} y2={height}
            stroke="#efe9e0" strokeWidth={1} />
        ))}
        {Array.from({ length: rows - 1 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={(i + 1) * CELL} x2={width} y2={(i + 1) * CELL}
            stroke="#efe9e0" strokeWidth={1} />
        ))}

        {locations.map((l) => {
          const isDragging = preview?.id === l.id;
          const rect = isDragging ? preview.rect : sectionRect(l);
          const p = px(rect);
          const invalid = isDragging && !preview.valid;
          const selected = selectedId === l.id;
          return (
            <g key={l.id}>
              <rect
                role="button"
                tabIndex={0}
                aria-label={`${l.name}, column ${rect.x + 1} row ${rect.y + 1}, ${rect.w} by ${rect.h} cells. Arrow keys move, shift and arrow keys resize.`}
                onPointerDown={(e) => onPointerDown(e, l, 'move')}
                onKeyDown={(e) => onKeyDown(e, l)}
                onFocus={() => setSelectedId(l.id)}
                x={p.x} y={p.y} width={p.w} height={p.h} rx={5}
                fill={invalid ? '#fdecea' : selected ? '#e8f5e9' : '#fff'}
                stroke={invalid ? '#c62828' : selected ? ACCENT : '#ccc'}
                strokeWidth={selected || invalid ? 2.5 : 1.5}
                strokeDasharray={isDragging ? '5 3' : undefined}
                style={{ cursor: 'grab', outline: 'none' }}
              />
              <text
                x={p.x + p.w / 2} y={p.y + p.h / 2}
                textAnchor="middle" dominantBaseline="middle"
                pointerEvents="none"
                style={{
                  fontSize: 10, fontWeight: 600, fontFamily: 'inherit',
                  fill: invalid ? '#c62828' : selected ? '#1b5e20' : '#777',
                }}
              >
                {l.name.length > p.w / 5.5 ? `${l.name.slice(0, Math.floor(p.w / 5.5))}…` : l.name}
              </text>
              {/* resize handle */}
              <rect
                role="button"
                tabIndex={-1}
                aria-label={`Resize ${l.name}`}
                onPointerDown={(e) => onPointerDown(e, l, 'resize')}
                x={p.x + p.w - HANDLE} y={p.y + p.h - HANDLE}
                width={HANDLE} height={HANDLE} rx={3}
                fill={selected ? ACCENT : '#ddd'}
                style={{ cursor: 'nwse-resize' }}
              />
            </g>
          );
        })}
      </svg>
      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#888' }}>
        Drag a section to move it, or its corner to resize. With one focused,
        arrow keys move it and shift with arrow keys resizes. Overlapping
        placements are refused.
      </p>
    </div>
  );
}
