import seedData from './mockDb_seed.json'

const INITIAL_ITEMS = seedData

const INITIAL_STOCK = seedData.map((item, index) => ({
  id: `se-init-${item.id}`,
  school_id: 'mock-school-1',
  item_id: item.id,
  qty_added: item.default_quantity || 0,
  entry_date: new Date().toISOString().split('T')[0],
  notes: 'Initial bulk purchase',
  created_at: new Date(Date.now() - index * 1000).toISOString()
}))

const INITIAL_USAGE = []

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
  getItems: () => getStorageItem('mock_inventory_items_v12', INITIAL_ITEMS),
  
  saveItem: (item) => {
    const items = mockDb.getItems()
    const newItem = {
      id: `item-${Date.now()}`,
      school_id: item.school_id || 'mock-school-1',
      is_active: true,
      created_at: new Date().toISOString(),
      ...item,
    }
    setStorageItem('mock_inventory_items_v12', [...items, newItem])
    return newItem
  },

  updateItem: (id, updates) => {
    const items = mockDb.getItems()
    const updated = items.map(item => item.id === id ? { ...item, ...updates } : item)
    setStorageItem('mock_inventory_items_v12', updated)
  },

  getStockEntries: () => getStorageItem('mock_stock_entries_v12', INITIAL_STOCK),

  saveStockEntry: (entry) => {
    const entries = mockDb.getStockEntries()
    const newEntry = {
      id: `se-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      school_id: entry.school_id || 'mock-school-1',
      created_at: new Date().toISOString(),
      ...entry,
    }
    setStorageItem('mock_stock_entries_v12', [newEntry, ...entries])
    return newEntry
  },

  getUsageLogs: () => getStorageItem('mock_usage_logs_v12', INITIAL_USAGE),

  saveUsageLog: (log) => {
    const logs = mockDb.getUsageLogs()
    const newLog = {
      id: `ul-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      school_id: log.school_id || 'mock-school-1',
      created_at: new Date().toISOString(),
      ...log,
    }
    setStorageItem('mock_usage_logs_v12', [newLog, ...logs])
    return newLog
  },

  getPriceUpdates: () => getStorageItem('mock_price_updates_v12', []),

  savePriceUpdate: (update) => {
    const updates = mockDb.getPriceUpdates()
    const newUpdate = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...update,
    }
    setStorageItem('mock_price_updates_v12', [newUpdate, ...updates])
    return newUpdate
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
        name_en: item.name_en,
        name_ta: item.name_ta,
        item_name: `${item.name_en} (${item.name_ta})`,
        category: item.category,
        image_url: item.image_url,
        unit: item.unit,
        tracking_mode: item.tracking_mode,
        estimated_cost: item.estimated_cost,
        purchase_cycle: item.purchase_cycle,
        threshold_qty: item.threshold_qty,
        current_stock: totalAdded - totalUsed,
      }
    })
  },

  getActivityFeed: (limit = 10) => {
    const items = mockDb.getItems()
    const stock = mockDb.getStockEntries().map(e => {
      const item = items.find(i => i.id === e.item_id)
      return {
        id: e.id,
        type: 'stock',
        qty: e.qty_added,
        created_at: e.created_at,
        item_name: item ? `${item.name_en} (${item.name_ta})` : 'Unknown item',
        unit: item?.unit ?? '',
      }
    })

    const usage = mockDb.getUsageLogs().map(e => {
      const item = items.find(i => i.id === e.item_id)
      return {
        id: e.id,
        type: 'usage',
        qty: e.qty_used,
        created_at: e.created_at,
        item_name: item ? `${item.name_en} (${item.name_ta})` : 'Unknown item',
        unit: item?.unit ?? '',
        meal_type: e.meal_type,
      }
    })

    const priceUpdates = mockDb.getPriceUpdates().map(e => {
      const item = items.find(i => i.id === e.item_id)
      return {
        id: e.id,
        type: 'price_update',
        old_price: e.old_price,
        new_price: e.new_price,
        created_at: e.created_at,
        item_name: item ? `${item.name_en} (${item.name_ta})` : 'Unknown item',
      }
    })

    return [...stock, ...usage, ...priceUpdates]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit)
  }
}
