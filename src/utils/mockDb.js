const INITIAL_ITEMS = [
  { id: 'item-1', school_id: 'mock-school-1', name: 'Rice', unit: 'kg', threshold_qty: 50, is_active: true },
  { id: 'item-2', school_id: 'mock-school-1', name: 'Dal (Lentils)', unit: 'kg', threshold_qty: 20, is_active: true },
  { id: 'item-3', school_id: 'mock-school-1', name: 'Cooking Oil', unit: 'litres', threshold_qty: 15, is_active: true },
  { id: 'item-4', school_id: 'mock-school-1', name: 'Salt', unit: 'kg', threshold_qty: 5, is_active: true },
  { id: 'item-5', school_id: 'mock-school-1', name: 'Turmeric Powder', unit: 'kg', threshold_qty: 2, is_active: true },
]

const INITIAL_STOCK = [
  { id: 'se-1', school_id: 'mock-school-1', item_id: 'item-1', qty_added: 120, entry_date: '2026-06-01', notes: 'Initial batch', created_at: new Date('2026-06-01T10:00:00Z').toISOString() },
  { id: 'se-2', school_id: 'mock-school-1', item_id: 'item-2', qty_added: 40, entry_date: '2026-06-01', notes: 'Initial batch', created_at: new Date('2026-06-01T10:05:00Z').toISOString() },
  { id: 'se-3', school_id: 'mock-school-1', item_id: 'item-3', qty_added: 30, entry_date: '2026-06-02', notes: 'Cooking oil delivery', created_at: new Date('2026-06-02T11:00:00Z').toISOString() },
  { id: 'se-4', school_id: 'mock-school-1', item_id: 'item-4', qty_added: 10, entry_date: '2026-06-02', notes: 'Salt packet', created_at: new Date('2026-06-02T11:15:00Z').toISOString() },
  { id: 'se-5', school_id: 'mock-school-1', item_id: 'item-5', qty_added: 4, entry_date: '2026-06-03', notes: 'Spice restock', created_at: new Date('2026-06-03T09:30:00Z').toISOString() },
]

const INITIAL_USAGE = [
  { id: 'ul-1', school_id: 'mock-school-1', item_id: 'item-1', qty_used: 12, used_on: '2026-06-02', meal_type: 'Lunch', notes: 'Afternoon meal', created_at: new Date('2026-06-02T13:30:00Z').toISOString() },
  { id: 'ul-2', school_id: 'mock-school-1', item_id: 'item-2', qty_used: 4, used_on: '2026-06-02', meal_type: 'Lunch', notes: 'Afternoon meal', created_at: new Date('2026-06-02T13:30:00Z').toISOString() },
  { id: 'ul-3', school_id: 'mock-school-1', item_id: 'item-1', qty_used: 10, used_on: '2026-06-03', meal_type: 'Lunch', notes: 'Standard consumption', created_at: new Date('2026-06-03T13:45:00Z').toISOString() },
  { id: 'ul-4', school_id: 'mock-school-1', item_id: 'item-3', qty_used: 2, used_on: '2026-06-03', meal_type: 'Lunch', notes: 'Oil for frying', created_at: new Date('2026-06-03T13:45:00Z').toISOString() },
]

function getStorageItem(key, fallback) {
  const stored = localStorage.getItem(key)
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(fallback))
    return fallback
  }
  return JSON.parse(stored)
}

function setStorageItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  // Dispatch custom event to notify realtime listeners in current tab
  window.dispatchEvent(new Event('mock-db-update'))
}

// Add cross-tab synchronization listener for mock mode
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    // If the storage event was triggered by our mock keys changing in another tab
    if (e.key && e.key.startsWith('mock_')) {
      window.dispatchEvent(new Event('mock-db-update'))
    }
  })
}

export function isMockMode() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  return !supabaseUrl || supabaseUrl.includes('dummy.supabase.co')
}

export const mockDb = {
  getItems: () => getStorageItem('mock_inventory_items', INITIAL_ITEMS),
  
  saveItem: (item) => {
    const items = mockDb.getItems()
    const newItem = {
      id: `item-${Date.now()}`,
      school_id: item.school_id || 'mock-school-1',
      is_active: true,
      created_at: new Date().toISOString(),
      ...item,
    }
    setStorageItem('mock_inventory_items', [...items, newItem])
    return newItem
  },

  updateItem: (id, updates) => {
    const items = mockDb.getItems()
    const updated = items.map(item => item.id === id ? { ...item, ...updates } : item)
    setStorageItem('mock_inventory_items', updated)
  },

  getStockEntries: () => getStorageItem('mock_stock_entries', INITIAL_STOCK),

  saveStockEntry: (entry) => {
    const entries = mockDb.getStockEntries()
    const newEntry = {
      id: `se-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      school_id: entry.school_id || 'mock-school-1',
      created_at: new Date().toISOString(),
      ...entry,
    }
    setStorageItem('mock_stock_entries', [newEntry, ...entries])
    return newEntry
  },

  getUsageLogs: () => getStorageItem('mock_usage_logs', INITIAL_USAGE),

  saveUsageLog: (log) => {
    const logs = mockDb.getUsageLogs()
    const newLog = {
      id: `ul-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      school_id: log.school_id || 'mock-school-1',
      created_at: new Date().toISOString(),
      ...log,
    }
    setStorageItem('mock_usage_logs', [newLog, ...logs])
    return newLog
  },

  getCurrentStock: () => {
    const items = mockDb.getItems().filter(i => i.is_active)
    const stockEntries = mockDb.getStockEntries()
    const usageLogs = mockDb.getUsageLogs()

    return items.map(item => {
      const totalAdded = stockEntries
        .filter(se => se.item_id === item.id)
        .reduce((sum, se) => sum + Number(se.qty_added), 0)

      const totalUsed = usageLogs
        .filter(ul => ul.item_id === item.id)
        .reduce((sum, ul) => sum + Number(ul.qty_used), 0)

      return {
        school_id: item.school_id,
        item_id: item.id,
        item_name: item.name,
        unit: item.unit,
        threshold_qty: item.threshold_qty,
        current_stock: totalAdded - totalUsed,
      }
    })
  },

  getActivityFeed: (limit = 10) => {
    const items = mockDb.getItems()
    const stock = mockDb.getStockEntries().map(e => ({
      id: e.id,
      type: 'stock',
      qty: e.qty_added,
      created_at: e.created_at,
      item_name: items.find(i => i.id === e.item_id)?.name ?? 'Unknown item',
      unit: items.find(i => i.id === e.item_id)?.unit ?? '',
    }))

    const usage = mockDb.getUsageLogs().map(e => ({
      id: e.id,
      type: 'usage',
      qty: e.qty_used,
      created_at: e.created_at,
      item_name: items.find(i => i.id === e.item_id)?.name ?? 'Unknown item',
      unit: items.find(i => i.id === e.item_id)?.unit ?? '',
      meal_type: e.meal_type,
    }))

    return [...stock, ...usage]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit)
  }
}
