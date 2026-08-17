import React from "react";
import { inputStyle, ACCENT } from "../../constants";

export default function LocationsTab({
    locations = [],
    newLocation = '',
    onLocationChange,
    onLocationSubmit,
    onAddLocation,
    onRemoveLocation
}) {
    const handleAdd = async () => {
        const trimmed = newLocation.trim();
        if (trimmed) {
            await onAddLocation(trimmed);
            onLocationSubmit("");
        }
    }
    const handleKeyDown = e => {
        if (e.key === 'Enter') {
            handleAdd();
        }
    }
    return (
          <>
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              marginBottom: 6
            }}>Storeroom Locations</h3>
            <p style={{ margin: "0 0 16px", color: "#777", fontSize: 14 }}>
              Where items physically live. Removing a location leaves its items in
              place — they simply become unassigned.
            </p>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input
                placeholder="e.g. Shelf C — Ropes"
                value={newLocation}
                onChange={onLocationChange}
                onKeyDown={handleKeyDown}
                style={{ ...inputStyle, flex: 1 }} />
                <button
                  onClick={handleAdd}
                  style={{
                    padding: "9px 16px",
                    background: ACCENT,
                    color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer"
                  }}>
                  + Add
                </button>
            </div>

            <div style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #e8e0d4",
              overflow: "hidden" }}>
              {locations.length === 0 ? (
                <p style={{ padding: "14px 18px", margin: 0, color: "#bbb", fontStyle: "italic" }}>
                  No locations yet. Add one above.
                </p>
              ) : locations.map((loc, i) => (
                <div
                  key={loc.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 18px",
                    borderBottom: i < locations.length - 1 ? "1px solid #f0ece4" : "none"
                  }}
                  >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>📍 {loc.name}</span>
                    {loc.protected && (
                      <span style={{
                        fontSize: 11,
                        color: "#1565c0",
                        background: "#e3f2fd",
                        padding: "2px 6px",
                        borderRadius: 6
                        }}>Protected</span>
                      )}
                  </div>
                  {!loc.protected && (
                    <button
                      onClick={() => onRemoveLocation(loc.id)}
                      style={{
                        padding: "5px 12px",
                        background: "#fce4ec",
                        color: "#c62828",
                        border: "none",
                        borderRadius: 7,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 12 }}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )
}
