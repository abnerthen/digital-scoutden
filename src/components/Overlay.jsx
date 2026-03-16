import React from 'react';

// ─── Overlay wrapper 
export default function Overlay({ children, wide }) {
  return (
    <div style={{ 
        position: "fixed", 
        inset: 0, 
        background: "rgba(0,0,0,0.6)", 
        zIndex: 100, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", padding: 16 
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        width: wide ? 680 : 460,
        maxWidth: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "32px 36px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
        border: "1px solid #e8e0d4",
        color: "#000",
      }}>
        {children}
      </div>
    </div>
  )
}