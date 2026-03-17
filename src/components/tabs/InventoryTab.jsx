import React from "react"
import { inputStyle, DARK, ACCENT } from "../../constants"

export default function InventoryTab( { 
    transactions, categories, displayItems, lowStock, search, onSearch, filterCat, onFilterCat, showRemoved, 
    onToggleRemoved, onCheckout, onCheckin, onBuyMore, onWriteOff, onRemove
} ) {
    return (
          <>
            {lowStock.length > 0 && (
              <div
                style={{
                  background: '#fff8e1',
                  border: '1px solid #ffe082',
                  borderRadius: 10,
                  padding: '10px 18px',
                  marginBottom: 18,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 20 }}>⚠️</span>
                <div>
                  <strong style={{ color: '#e65100' }}>Low Stock: </strong>
                  <span style={{ color: '#555' }}>
                    {lowStock
                      .map((i) => `${i.name} (${i.quantity})`)
                      .join(', ')}
                  </span>
                </div>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 18,
                flexWrap: 'wrap',
              }}
            >
              <input
                placeholder="🔍 Search…"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                style={{ flex: 1, minWidth: 180, ...inputStyle }}
              />
              <select
                value={filterCat}
                onChange={(e) => onFilterCat(e.target.value)}
                style={{ ...inputStyle, width: 'auto', flex: 'none' }}
              >
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button
                onClick={onToggleRemoved}
                style={{
                  padding: '9px 14px',
                  background: showRemoved ? '#fce4ec' : '#f5f0e8',
                  color: showRemoved ? '#c62828' : '#666',
                  border: showRemoved
                    ? '1.5px solid #ef9a9a'
                    : '1.5px solid #ddd',
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {showRemoved ? '👁 Archived' : '🗑️ Show Archived'}
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 14,
                flexWrap: 'wrap',
              }}
            >
              {[
                {
                  label: '▼ Out — Check out units',
                  color: '#e65100',
                  bg: '#fff3e0',
                },
                {
                  label: '▲ In — Return units to store',
                  color: '#2e7d32',
                  bg: '#e8f5e9',
                },
                {
                  label: '🛒 — Buy more units',
                  color: '#1565c0',
                  bg: '#e3f2fd',
                },
                {
                  label: '✕ — Write off damaged/lost units',
                  color: '#c62828',
                  bg: '#fff3e0',
                },
                {
                  label: '🗑 — Archive entire item',
                  color: '#c62828',
                  bg: '#fce4ec',
                },
              ].map((l) => (
                <span
                  key={l.label}
                  style={{
                    fontSize: 11,
                    background: l.bg,
                    color: l.color,
                    borderRadius: 6,
                    padding: '3px 9px',
                    fontWeight: 600,
                  }}
                >
                  {l.label}
                </span>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))',
                gap: 14,
              }}
            >
              {displayItems.map((item) => {
                const unitsAccountedFor = (item.quantity || 0) + transactions
                  .filter(t => t.item_id === item.id && t.returned_at === null)
                  .reduce((sum, t) => sum + t.qty, 0)

                const hasPendingDelivery = (item.total_owned || 0) > unitsAccountedFor
                const hasOpenTransactions = transactions.some(t => t.item_id === item.id && t.returned_at === null)
                const canCheckIn = hasOpenTransactions || hasPendingDelivery
            return (
                <div
                  key={item.id}
                  style={{
                    background: item.removed ? '#fafafa' : '#fff',
                    borderRadius: 14,
                    border: item.removed
                      ? '1px dashed #e0a0a0'
                      : '1px solid #e8e0d4',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    opacity: item.removed ? 0.75 : 1,
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!item.removed)
                      e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
                >
                  {item.image && (
                    <img
                      src={item.imageUrl || item.image}
                      alt={item.name}
                      style={{
                        width: '100%',
                        height: 110,
                        objectFit: 'cover',
                        filter: item.removed ? 'grayscale(60%)' : 'none',
                      }}
                    />
                  )}
                  <div style={{ padding: '13px 15px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <h3
                        style={{
                          margin: '0 0 3px',
                          fontFamily: "'Playfair Display',serif",
                          fontSize: 15,
                          color: item.removed ? '#aaa' : DARK,
                          textDecoration: item.removed
                            ? 'line-through'
                            : 'none',
                        }}
                      >
                        {item.name}
                      </h3>
                      <span
                        style={{
                          fontSize: 10,
                          background: '#f0ece4',
                          color: '#666',
                          borderRadius: 6,
                          padding: '2px 7px',
                          flexShrink: 0,
                          marginLeft: 6,
                        }}
                      >
                        {item.category}
                      </span>
                    </div>
                    {item.removed ? (
                      <div
                        style={{
                          margin: '8px 0',
                          padding: '7px 10px',
                          background: '#fce4ec',
                          borderRadius: 8,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            color: '#c62828',
                            fontWeight: 700,
                          }}
                        >
                          ✕ Archived
                        </p>
                        <p
                          style={{
                            margin: '2px 0 0',
                            fontSize: 11,
                            color: '#888',
                          }}
                        >
                          {item.removedReason}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div style={{ margin: '6px 0 10px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'baseline',
                              gap: 4,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 26,
                                fontWeight: 900,
                                fontFamily: "'Playfair Display',serif",
                                color: item.quantity <= 2 ? '#c62828' : ACCENT,
                              }}
                            >
                              {item.quantity}
                            </span>
                            <span style={{ fontSize: 12, color: '#888' }}>
                              in store
                            </span>
                            <span
                              style={{
                                fontSize: 13,
                                color: '#bbb',
                                margin: '0 2px',
                              }}
                            >
                              /
                            </span>
                            <span
                              style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: '#555',
                              }}
                            >
                              {item.total_owned}
                            </span>
                            <span style={{ fontSize: 12, color: '#888' }}>
                              owned
                            </span>
                          </div>
                          {item.quantity < item.total_owned && (
                            <div
                              style={{
                                fontSize: 11,
                                color: '#e65100',
                                marginTop: 2,
                              }}
                            >
                              {item.total_owned - item.quantity} {item.unit}{' '}
                              currently out
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => onCheckout(item)}
                            disabled={item.quantity === 0}
                            style={{
                              flex: 1,
                              padding: '7px 0',
                              background:
                                item.quantity === 0 ? '#eee' : '#fff3e0',
                              color: item.quantity === 0 ? '#ccc' : '#e65100',
                              border: 'none',
                              borderRadius: 7,
                              fontWeight: 700,
                              cursor:
                                item.quantity === 0 ? 'not-allowed' : 'pointer',
                              fontSize: 12,
                            }}
                          >
                            ▼ Out
                          </button>
                          <button
                            onClick={() => onCheckin(item)}
                            disabled={!canCheckIn}
                            title={!canCheckIn
                              ? "No open checkouts for this item"
                              : "Return units to store"
                            }
                            style={{
                              flex: 1,
                              padding: '7px 0',
                              background:
                                !canCheckIn
                                  ? '#eee'
                                  : '#e8f5e9',
                              color:
                                !canCheckIn
                                  ? '#ccc'
                                  : '#2e7d32',
                              border: 'none',
                              borderRadius: 7,
                              fontWeight: 700,
                              cursor:
                                !hasOpenTransactions
                                  ? 'not-allowed'
                                  : 'pointer',
                              fontSize: 12,
                            }}
                          >
                            ▲ In
                          </button>
                          <button
                            onClick={() => onBuyMore(item)}
                            title="Buy more units"
                            style={{
                              padding: '7px 10px',
                              background: '#e3f2fd',
                              color: '#1565c0',
                              border: '1.5px solid #90caf9',
                              borderRadius: 7,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            🛒
                          </button>
                          <button
                            onClick={() => onWriteOff(item)}
                            title="Write off damaged/lost units"
                            style={{
                              padding: '7px 10px',
                              background: '#fff3e0',
                              color: '#c62828',
                              border: '1.5px solid #ffcc80',
                              borderRadius: 7,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            ✕
                          </button>
                          <button
                            onClick={() => onRemove(item)}
                            title="Archive entire item"
                            style={{
                              padding: '7px 10px',
                              background: '#fce4ec',
                              color: '#c62828',
                              border: '1.5px solid #ef9a9a',
                              borderRadius: 7,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              )}
              {displayItems.length === 0 && (
                <p
                  style={{
                    color: '#aaa',
                    fontStyle: 'italic',
                    gridColumn: '1/-1',
                  }}
                >
                  No items found.
                </p>
              )}
            </div>
          </>
        )
}