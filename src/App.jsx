import React, { useState, useRef, useEffect } from 'react';
import { BG, DARK, ACCENT, ACCENT2, ROLES, labelStyle, inputStyle, headerBtnStyle } from './constants';
import { getItems, addItem, updateItemQuantity, archiveItem, uploadItemImage, updateItem } from './lib/items';
import { getGroups, saveGroup } from './lib/groups';
import { getLog, writeLog } from './lib/log';
import { signOut } from './lib/auth';
import { createCheckout, closeTransaction, getOpenTransactions } from './lib/transactions';
import { getMembers, addMember, deactivateMember, updateMember, restoreMember, getInactiveMembers } from './lib/members';
import { getCategories, addCategory, deleteCategory } from './lib/categories';
import troop_logo from './assets/troop_logo.png';

import Overlay from './components/elements/Overlay';
import Badge from './components/elements/Badge';

// import modals
import WriteOffModal from './components/modals/WriteOffModal';
import GroupDetailModal from './components/modals/GroupDetailModal';
import AddItemModal from './components/modals/AddItemModal';
import RemoveItemModal from './components/modals/RemoveItemModal';
import CheckInModal from './components/modals/CheckInModal';
import CheckOutModal from './components/modals/CheckOutModal';
import BuyMoreModal from './components/modals/BuyMoreModal';
import GroupModal from './components/modals/GroupModal';
import AddMemberModal from './components/modals/AddMemberModal';

import LogTab from './components/tabs/LogTab';
import MembersTab from './components/tabs/MembersTab';
import CategoriesTab from './components/tabs/CategoriesTab';
import GroupsTab from './components/tabs/GroupsTab';
import InventoryTab from './components/tabs/InventoryTab';

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [log, setLog] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([])
  const [categories, setCategories] = useState([])
  const [modal, setModal] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [showRemoved, setShowRemoved] = useState(false);
  const [loading, setLoading] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [inactiveMembers, setInactiveMembers] = useState([])
  const [showInactive, setShowInactive] = useState(false)
  const nextId = useRef(200);

  useEffect(() => {
    async function load() {
      const [itemsData, groupsData, logData, txData, membersData, categoriesData] = await Promise.all([
        getItems(),
        getGroups(),
        getLog(),
        getOpenTransactions(),
        getMembers(),
        getCategories(),
      ])
      setItems(itemsData);
      setGroups(groupsData);
      setLog(logData);
      setTransactions(txData);
      setLoading(false);
      setMembers(membersData);
      setCategories(categoriesData);
    }
    load();
  }, [])

  // useEffect to load inactive members when switching to members tab
  useEffect(() => {
    if (activeTab === 'members') {
      getInactiveMembers().then(setInactiveMembers)
    }
  }, [activeTab])

  if (loading) return (
    <div style={{ padding: 40, fontFamily: 'serif' }}>Loading storeroom...</div>
  )

  const addLog = async (entry) => {
    console.log('addLog called with:', entry)
    const logEntry = {
      type: entry.type,
      item_id: entry.itemId || null,
      item_name: entry.itemName,
      qty: entry.qty,
      unit: entry.unit,
      requester_id: entry.requesterId,
      checker_id: entry.checkerId,
      event: entry.event || null,
      notes: entry.notes || null,

    }
    console.log('writing to supabase:', logEntry) 
    const saved = await writeLog(logEntry);
    setLog((prev) => [saved, ...prev]);
  }

  // ── Item handlers ──
  const handleCheckOut = async (item, { qty, groupId, groupName, requester, checker, event, remarks }) => {
    const tx = {
      item_id: item.id,
      group_id: groupId || null,
      qty,
      requester_id: requester,
      checkout_checker_id: checker,
      event: event || null,
      checkout_remarks: remarks || null,
      checked_out_at: new Date(),
    }
    const saved = await createCheckout(tx)
    console.log('saved tx:', saved)
    console.log('transactions after:', transactions)
    setTransactions(prev => {
      console.log('prev tx:', prev)
      const updated = [...prev, saved]
      console.log('updated tx:', updated)
      return updated
    })
    await updateItemQuantity(item.id, item.quantity - qty, item.total_owned)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - qty } : i))
    if (groupId) {
      setGroups(prev => prev.map(g => g.id === groupId
        ? { ...g, checkouts: [...(g.checkouts || []), { itemId: item.id, itemName: item.name, unit: item.unit, qty, date: Date.now(), event }] }
        : g))
    }
    await addLog({
      type: 'OUT',
      itemId: item.id,
      itemName: item.name,
      qty,
      unit: item.unit,
      requester_id: requester || null,
      checker_id: checker || null,
      event: event || null,
      notes: remarks || null,
    })
    setModal(null)
  }

  const handleCheckIn = async (item, { txId, qty, groupId, groupName, returner, checker, condition, remarks, isPendingDelivery }) => {
    const newQty = (item.quantity || 0) + qty;

    if (!isPendingDelivery && txId) {
      await closeTransaction(txId, {
        returner_id: returner,
        return_checker_id: checker,
        condition,
        return_remarks: remarks || null,
      })
      setTransactions(prev => prev.filter(t => t.id !== txId))
    }

    await updateItemQuantity(item.id, newQty, item.total_owned)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i))

    await addLog({
      type: 'IN',
      itemId: item.id,
      itemName: item.name,
      qty,
      unit: item.unit,
      requester_id: returner,
      checker_id: checker ,
      event: isPendingDelivery ? 'Delivery received' : null,
      notes: isPendingDelivery ? remarks || null : `${condition}${remarks ? ' — ' + remarks : ''}`,
    })
    setModal(null)
  }

  const handleWriteOff = async (item, { qty, checker, reason }) => {
    const newQuantity = item.quantity - qty;
    const newTotalOwned = item.total_owned - qty;
    await updateItemQuantity(item.id, newQuantity, newTotalOwned);
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, quantity: newQuantity, total_owned: newTotalOwned }
          : i
      )
    );
    await addLog({
      type: 'WRITEOFF',
      itemId: item.id,
      itemName: item.name,
      qty,
      unit: item.unit,
      requesterId: checker,
      checkerId: checker,
      notes: reason,
      event: 'Write-off',
    });
    setModal(null);
  };

  const handleAddItem = async (data) => {
    const newItem = await addItem({
      name: data.name,
      category_id: data.categoryId,
      quantity: data.quantity,
      total_owned: data.quantity,
      unit: data.unit,
      notes: data.notes || null,
      removed: false,
    })
    console.log('adding item:', newItem);

    // upload image if one was selected
    if (data.imageFile) {
      try {
        const imageUrl = await uploadItemImage(data.imageFile, newItem.id)
        await updateItem(newItem.id, { image_url: imageUrl })
        newItem.image_url = imageUrl
      } catch (err) {
        console.error("Image upload failed:", err)
      }
    }
    console.log('checkerId:', data.checkerId)
    setItems((prev) => [...prev, newItem]);
    await addLog({
      type: 'ADD',
      itemId: newItem.id,
      qty: newItem.quantity,
      unit: newItem.unit,
      requesterId: data.checkerId,
      checkerId: data.checkerId,
      notes: data.notes || '',
      event: 'New purchase',
    });
  };

  const handleBuyMore = async (item, { qty, receiveNow, notes }) => {
    const newTotalOwned = item.total_owned + qty;
    const newQuantity = receiveNow ? item.quantity + qty : item.quantity;

    await updateItemQuantity(item.id, newQuantity, newTotalOwned);
    setItems(prev => prev.map(i => i.id === item.id
      ? { ...i, total_owned: newTotalOwned, quantity: newQuantity }
      : i
    ));
    await addLog({
      type: 'ADD',
      itemId: item.id,
      itemName: item.name,
      qty,
      unit: item.unit,
      checker: 'Quartermaster',
      notes: notes || null,
      event: receiveNow ? 'Restock — received' : 'Restock — pending delivery',
    });
    setModal(null);
  };

  const handleRemoveItem = async (item, reason) => {
    await archiveItem(item.id, reason);
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, removed: true, removedReason: reason } : i
      )
    );
    await addLog({
      type: 'DELETE',
      itemName: item.name,
      qty: item.quantity,
      unit: item.unit,
      scout: 'Quartermaster',
      notes: reason,
      event: 'Item archived',
    });
    setModal(null);
  };

  // -- Category handlers --
  const handleAddCategory = async (name) => {
    const newCat = await addCategory(name)
    setCategories(prev => [...prev, newCat])
  }

  const handleRemoveCategory = async (id) => {
    if (window.confirm("Are you sure you want to delete this category? Items in this category will not be deleted but will be uncategorized.")) {
      await handleDeleteCategory(id)
      setCategories(prev => prev.filter(c => c.id !== id))
    }
  }

  // ── Group handlers ──
  const handleSaveGroup = async (data, editId) => {
    const { id, checkouts, ...groupData } = data
    const saved = await saveGroup({ 
      ...groupData, 
      id: editId || undefined })
    if (editId) {
      setGroups(prev => prev.map(g => g.id === editId 
        ? { ...saved,
          checkouts: g.checkouts || []
      } : g))
    } else {
      setGroups(prev => [...prev, saved])
    }
  };

  // -- Member handlers --
  const handleAddMember = async (data) => {
    const newMember = await addMember(data)
    setMembers(prev => [...prev, newMember])
  }

  const handleDeactivateMember = async (id) => {
    const deactivated = await deactivateMember(id)
    setInactiveMembers(prev => [...prev, deactivated])
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  const handleEditMember = async (id, data) => {
    console.log('handleEditMember called:', id, data)
    try {
      const updated = await updateMember(id, data)
      console.log('updated:', updated)
      setMembers(prev => prev.map(m => m.id === id ? updated : m))
    } catch (err) {
      console.error('handleEditMember error:', err)
      alert(err.message)
    }
  }

  const handleRestoreMember = async (id) => {
    const restored = await restoreMember(id)
    setMembers(prev => [...prev, restored])
    setInactiveMembers(prev => prev.filter(m => m.id !== id))
  }

  // ── Derived ──
  const activeItems = items.filter((i) => !i.removed);
  const removedItems = items.filter((i) => i.removed);
  const displayItems = (showRemoved ? removedItems : activeItems).filter(
    (i) => {
      const s = search.toLowerCase();
      return (
        (i.name.toLowerCase().includes(s) ||
          i.category.toLowerCase().includes(s)) &&
        (filterCat === 'All' || i.category === filterCat)
      );
    }
  );
  const lowStock = activeItems.filter((i) => i.quantity <= 2);
  const totalUnits = activeItems.reduce((a, b) => a + b.quantity, 0);
  const groupsWithItems = groups.filter((g) => (g.checkouts || []).length > 0);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG,
        fontFamily: "'Source Serif 4', Georgia, serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400&display=swap"
        rel="stylesheet"
      />

      {/* HEADER */}
      <header
        style={{
          background: DARK,
          color: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `4px solid ${ACCENT2}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 0',
          }}
        >
          <img 
            src={troop_logo}
            alt="Troop Logo"
            style={{ width: 40, height: 40, objectFit: 'contain'}}
          />
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: "'Playfair Display',serif",
                fontSize: 21,
                letterSpacing: 0.5,
              }}
            >
              Storeroom Ledger
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: '#aaa',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              Scout Quartermaster System
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setModal({ type: 'addItem' })}
            style={headerBtnStyle}
          >
            ＋ Item
          </button>
          <button
            onClick={() => setModal({ type: 'newGroup' })}
            style={{ ...headerBtnStyle,
              background: '#455a64'}}>
            👥 Group
          </button>
          <button
            onClick={() => signOut()}
            style={{ ...headerBtnStyle,
              background: '#ff0000'}}>
            SIGN OUT
          </button>
        </div>
      </header>

      {/* STATS */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e0e0e0',
          padding: '10px 28px',
          display: 'flex',
          gap: 28,
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'Active Items', val: activeItems.length, icon: '📦' },
          { label: 'Units in Store', val: totalUnits, icon: '🔢' },
          { label: 'Groups', val: groups.length, icon: '👥' },
          {
            label: 'Groups w/ Items Out',
            val: groupsWithItems.length,
            icon: '📤',
            alert: groupsWithItems.length > 0,
          },
          {
            label: 'Low Stock',
            val: lowStock.length,
            icon: '⚠️',
            alert: lowStock.length > 0,
          },
          { label: 'Log Entries', val: log.length, icon: '📋' },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18 }}>{s.icon}</div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                fontFamily: "'Playfair Display',serif",
                color: s.alert ? '#c62828' : DARK,
              }}
            >
              {s.val}
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: 0.4,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div
        style={{
          display: 'flex',
          padding: '0 28px',
          background: '#fff',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        {['inventory', 'groups', 'members', 'log', 'categories'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 22px',
              border: 'none',
              background: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              borderBottom:
                activeTab === tab
                  ? `3px solid ${ACCENT}`
                  : '3px solid transparent',
              color: activeTab === tab ? ACCENT : '#888',
              fontFamily: 'inherit',
              letterSpacing: 0.5,
            }}
          >
            {tab === 'inventory'
              ? '📦 Inventory'
              : tab === 'groups'
              ? '👥 Groups'
              : tab === "members" 
              ? "👤 Members"
              : tab === "log"
              ? '📋 Log'
              : '📂 Categories'}
          </button>
        ))}
      </div>

      <main style={{ padding: '22px 28px', maxWidth: 1140, margin: '0 auto' }}>
        {/* ── INVENTORY TAB ── */}
        
        {activeTab === 'inventory' && 
          <InventoryTab
          categories={categories}
          transactions={transactions}
          displayItems={displayItems}
          lowStock={lowStock}
          search={search}
          onSearch={setSearch}
          filterCat={filterCat}
          onFilterCat={setFilterCat}
          showRemoved={showRemoved}
          onToggleRemoved={() => setShowRemoved(v => !v)}
          onCheckout={item => setModal({ type: 'checkout', item })}
          onCheckin={item => setModal({ type: 'checkin', item })}
          onWriteOff={item => setModal({ type: 'writeoff', item })}
          onBuyMore={item => setModal({ type: 'buymore', item })}
          onRemove={item => setModal({ type: 'removeItem', item })}
         />
        }

        {/* ── GROUPS TAB ── */}
        
        {activeTab === 'groups' && <GroupsTab
          groups={groups}
          members={members}
          onAddGroup={() => setModal({ type: 'newGroup' })}
          onGroupDetail={group => setModal({ type: 'groupDetail', group })}
        />
        }

        {/* -- MEMBERS TAB -- */}
        {activeTab === "members" && <MembersTab 
          members={members} 
          inactiveMembers={inactiveMembers}
          showInactive={showInactive}
          onToggleInactive={() => setShowInactive(v => !v)}
          onAddMember={() => setModal({ type: "addMember" })}
          onEditMember={(member) => setModal({ type: "editMember", member })}
          onRestore={handleRestoreMember}
          onDeactivate={handleDeactivateMember}
          />}

        {/* ── LOG TAB ── */}
        {activeTab === 'log' && <LogTab log={log} />}

        {/* -- CATEGORIES TAB -- */}

        {activeTab === "categories" && <CategoriesTab
          categories={categories}
          onCategoryChange={e => setNewCategory(e.target.value)}
          onCategorySubmit={setNewCategory}
          onAddCategory={handleAddCategory}
          onRemoveCategory={handleRemoveCategory}
         />
      }
      </main>

      {/* MODALS */}
      {modal?.type === "checkout" && (
        <CheckOutModal item={modal.item} groups={groups}
          members={members}
          onClose={() => setModal(null)}
          onConfirm={d => handleCheckOut(modal.item, d)} />
      )}
      {modal?.type === "checkin" && (
        <>
        {console.log('passing OpenTransactions:', transactions.filter(t => t.item_id === modal.item.id && t.returned_at === null))}
        <CheckInModal item={modal.item}
          openTransactions={transactions.filter(t => 
            t.item_id === modal.item.id && t.returned_at === null)}
          members={members}
          onClose={() => setModal(null)}
          onConfirm={d => handleCheckIn(modal.item, d)} />
        </>
      )}
      {modal?.type === 'writeoff' && (
        <WriteOffModal
          item={modal.item}
          onClose={() => setModal(null)}
          onConfirm={(d) => handleWriteOff(modal.item, d)}
        />
      )}
      {modal?.type === 'addItem' && (
        <AddItemModal 
          onClose={() => setModal(null)} 
          onAdd={handleAddItem} 
          categories={categories}
          members={members} />
      )}
      {modal?.type === 'buyMore' && (
        <BuyMoreModal
          item={modal.item}
          onClose={() => setModal(null)}
          onConfirm={(d) => handleBuyMore(modal.item, d)}
        />
      )}
      {modal?.type === 'removeItem' && (
        <RemoveItemModal
          item={modal.item}
          onClose={() => setModal(null)}
          onConfirm={(r) => handleRemoveItem(modal.item, r)}
        />
      )}
      {modal?.type === 'addMember' && (
        <AddMemberModal
          onClose={() => setModal(null)}
          onAdd={handleAddMember}
        />
      )}
      {modal?.type === 'editMember' && (
        <AddMemberModal
          member={modal.member}
          onClose={() => setModal(null)}
          onEdit={handleEditMember} />
      )}
      {modal?.type === 'newGroup' && (
        <GroupModal
          availableMembers={members}
          onClose={() => setModal(null)}
          onSave={(data) => handleSaveGroup(data, null)}
        />
      )}
      {modal?.type === 'editGroup' && (
        <GroupModal
          group={modal.group}
          availableMembers={members}
          onClose={() => setModal(null)}
          onSave={(data) => handleSaveGroup(data, modal.group.id)}
        />
      )}
      {modal?.type === 'groupDetail' && (
        <GroupDetailModal
          group={modal.group}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: 'editGroup', group: modal.group })}
        />
      )}
    </div>
  );
}
