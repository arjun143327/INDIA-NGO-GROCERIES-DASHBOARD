import { useState, useMemo } from 'react'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'
import { isMockMode, mockDb } from '../../utils/mockDb'
import { useAuth } from '../../context/AuthContext'
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useCurrentStock } from '../../hooks/useCurrentStock'
import NewItemForm from './NewItemForm'
import { Plus, Trash2 } from 'lucide-react'
import SearchableDropdown from '../ui/SearchableDropdown'
import CategoryChips from '../ui/CategoryChips'

export default function StockEntryForm({ open, onClose, onSuccess }) {
  const { profile } = useAuth()
  const { items, refetch } = useInventoryItems()
  const { stock } = useCurrentStock()
  
  const [entryMode, setEntryMode] = useState('incoming') // 'incoming' or 'adjustment'
  const [entryItems, setEntryItems] = useState([{ id: Date.now(), item_id: '', quantity: '', category_filter: 'All' }])
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showNewItem, setShowNewItem] = useState(false)

  // To prevent selecting the same item twice
  const selectedItemIds = entryItems.map(i => i.item_id).filter(Boolean)

  async function handleSubmit(e) {
    e.preventDefault()
    
    // Filter out incomplete rows
    const validItems = entryItems.filter(i => i.item_id && i.quantity && Number(i.quantity) > 0)
    if (validItems.length === 0 || !date) return

    setSubmitting(true)
    setError('')

    try {
      for (const item of validItems) {
        const qty = Number(item.quantity)
        
        if (entryMode === 'adjustment') {
          const currentStockItem = stock.find(s => s.item_id === item.item_id)
          const currentQty = currentStockItem ? currentStockItem.current_stock : 0
          const diff = qty - currentQty

          if (diff > 0) {
            // Need to add stock
            const entry = {
              school_id: profile?.school_id || 'mock-school-1',
              item_id: item.item_id,
              qty_added: diff,
              entry_date: date,
              notes: `Manual Adjustment: ${notes}`,
              created_by: profile?.id || 'mock-user'
            }
            if (isMockMode()) mockDb.saveStockEntry(entry)
            else await supabase.from('stock_entries').insert(entry)
          } else if (diff < 0) {
            // Need to remove stock (log usage)
            const usageLog = {
              school_id: profile?.school_id || 'mock-school-1',
              item_id: item.item_id,
              qty_used: Math.abs(diff),
              used_on: date,
              meal_type: 'Lunch', // Or just 'Adjustment' if we had it
              notes: `Manual Adjustment: ${notes}`,
              created_by: profile?.id || 'mock-user'
            }
            if (isMockMode()) mockDb.saveUsageLog(usageLog)
            else await supabase.from('usage_logs').insert(usageLog)
          }
        } else {
          // Standard incoming stock
          const entry = {
            school_id: profile?.school_id || 'mock-school-1',
            item_id: item.item_id,
            qty_added: qty,
            entry_date: date,
            notes,
            created_by: profile?.id || 'mock-user'
          }
          if (isMockMode()) mockDb.saveStockEntry(entry)
          else await supabase.from('stock_entries').insert(entry)
        }
      }

      setSubmitting(false)
      resetForm()
      onSuccess()
    } catch (err) {
      setError('Failed to record stock. Please try again.')
      setSubmitting(false)
    }
  }

  function updateItem(id, field, value) {
    setEntryItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  function addItemRow() {
    setEntryItems(prev => [...prev, { id: Date.now(), item_id: '', quantity: '', category_filter: 'All' }])
  }

  function removeItemRow(id) {
    setEntryItems(prev => prev.filter(item => item.id !== id))
  }

  function resetForm() {
    setEntryMode('incoming')
    setEntryItems([{ id: Date.now(), item_id: '', quantity: '', category_filter: 'All' }])
    setDate(new Date().toISOString().split('T')[0])
    setNotes('')
  }

  function handleNewItemSuccess() {
    setShowNewItem(false)
    refetch()
  }

  return (
    <>
      <Modal title="Manage Stock Levels" open={open && !showNewItem} onClose={onClose} maxWidthClass="max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* Toggle Mode */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setEntryMode('incoming')}
                className={`flex-1 text-[12px] font-medium py-1.5 rounded-md transition-colors ${entryMode === 'incoming' ? 'bg-white text-app-greenMid shadow-sm' : 'text-app-textSecondary hover:text-app-textPrimary'}`}
              >
                Add Incoming Stock
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('adjustment')}
                className={`flex-1 text-[12px] font-medium py-1.5 rounded-md transition-colors ${entryMode === 'adjustment' ? 'bg-white text-app-greenMid shadow-sm' : 'text-app-textSecondary hover:text-app-textPrimary'}`}
              >
                Manual Audit / Set Exact
              </button>
            </div>

            <div>
              <div className="mb-1.5 flex justify-between items-center">
                <label className="block text-[11px] font-medium text-app-textSecondary">
                  Grocery Items
                </label>
                <button 
                  type="button" 
                  onClick={() => setShowNewItem(true)}
                  className="text-[11px] text-app-greenMid hover:underline"
                >
                  + Add New Catalog Item
                </button>
              </div>
              
              <div className="space-y-2 max-h-[40vh] overflow-y-auto px-1 -mx-1">
                {entryItems.map((item, index) => {
                  const selectedStockItem = items.find(i => i.id === item.item_id)
                  
                  return (
                    <div key={item.id} className="relative rounded-[8px] border border-app-border bg-gray-50/50 p-3">
                      <CategoryChips 
                        selectedCategory={item.category_filter} 
                        onSelectCategory={(val) => updateItem(item.id, 'category_filter', val)} 
                      />
                      <div className="flex gap-2 items-start mt-1">
                        <div className="flex-1">
                          <SearchableDropdown
                            items={items.filter(s => {
                              const isAvailable = !selectedItemIds.includes(s.id) || s.id === item.item_id
                              const matchesCategory = item.category_filter === 'All' || s.category === item.category_filter
                              return isAvailable && matchesCategory
                            }).map(i => ({ ...i, name: i.name_en }))}
                            value={item.item_id}
                            onChange={(val) => updateItem(item.id, 'item_id', val)}
                          />
                        </div>
                        
                        <div className="w-[150px]">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step={selectedStockItem?.tracking_mode === 'count_only' ? "1" : "0.01"}
                              required
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                              placeholder={entryMode === 'adjustment' ? "Actual count" : "Qty"}
                              className="h-[34px] w-full rounded-[6px] border border-app-border bg-white pl-3 pr-[60px] text-[12px] text-app-textPrimary focus:border-app-greenMid focus:outline-none"
                            />
                            {selectedStockItem && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-app-textSecondary">
                                {selectedStockItem.unit}
                              </span>
                            )}
                          </div>
                        </div>

                        {entryItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(item.id)}
                            className="mt-1 flex h-7 w-7 items-center justify-center rounded text-app-textSecondary hover:bg-app-redBg hover:text-app-red transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <button
                type="button"
                onClick={addItemRow}
                className="mt-3 flex items-center gap-1 text-[12px] font-medium text-app-greenMid hover:text-app-greenDark transition-colors"
              >
                <Plus size={14} />
                Add another item
              </button>
            </div>

            <div className="flex gap-4 pt-2">
              <div className="flex-1">
                <label htmlFor="stockDate" className="mb-1.5 block text-[11px] font-medium text-app-textSecondary uppercase tracking-wide">
                  Date
                </label>
                <input
                  id="stockDate"
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-[36px] w-full rounded-[6px] border border-app-border bg-white px-3 text-[13px] text-app-textPrimary focus:border-app-greenMid focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="stockNotes" className="mb-1.5 block text-[11px] font-medium text-app-textSecondary">
                Notes (Optional)
              </label>
              <textarea
                id="stockNotes"
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Received from District supply"
                className="w-full rounded-lg border border-app-border bg-white p-3 text-[12px] text-app-textPrimary focus:border-app-greenMid focus:outline-none focus:ring-1 focus:ring-app-greenMid"
              ></textarea>
            </div>
          </div>

          {error && <p className="mt-3 text-[12px] text-app-red">{error}</p>}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-[32px] rounded-lg border border-app-border bg-white px-4 text-[12px] font-semibold text-app-textPrimary hover:bg-app-surfaceAlt"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-[32px] rounded-lg bg-app-greenMid px-4 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Stock'}
            </button>
          </div>
        </form>
      </Modal>

      <NewItemForm 
        open={showNewItem} 
        onClose={() => setShowNewItem(false)} 
        onSuccess={handleNewItemSuccess}
      />
    </>
  )
}
