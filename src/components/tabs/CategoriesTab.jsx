import React from "react";
import { inputStyle, ACCENT } from "../../constants";

export default function CategoriesTab({
    categories = [], 
    newCategory = '', 
    onCategoryChange, 
    onCategorySubmit, 
    onAddCategory, 
    onRemoveCategory 
}) {
    const handleAdd = async () => {
        const trimmed = newCategory.trim();
        if (trimmed) {
            await onAddCategory(trimmed);
            onCategorySubmit("");
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
              marginBottom: 16 
            }}>Categories</h3>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input 
                placeholder="New category name"
                value={newCategory}
                onChange={onCategoryChange}
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
              {categories.map((cat, i) => (
                <div 
                  key={cat.id} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    padding: "12px 18px", 
                    borderBottom: i < categories.length - 1 ? "1px solid #f0ece4" : "none" 
                  }}
                  >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{cat.name}</span>
                    {cat.protected && (
                      <span style={{ 
                        fontSize: 11, 
                        color: "#1565c0", 
                        background: "#e3f2fd", 
                        padding: "2px 6px", 
                        borderRadius: 6 
                        }}>Protected</span>
                      )}
                  </div>
                  {!cat.protected && (
                    <button
                      onClick={() => onRemoveCategory(cat.id)}
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