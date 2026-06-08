import { useState, useMemo } from 'react'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'
import { isMockMode, mockDb } from '../../utils/mockDb'
import { useAuth } from '../../context/AuthContext'
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useCurrentStock } from '../../hooks/useCurrentStock'
import NewItemForm from './NewItemForm'
import SearchableDropdown from '../ui/SearchableDropdown'

export default function StockEntryForm({ open, onClose, onSuccess }) {
  const { profile } = useAuth()
  const { items, refetch } = useInventoryItems()
  const { stock } = useCurrentStock()
  
  const [entryMode, setEntryMode] = useState('incoming') // 'incoming' or 'adjustment'
  const [itemId, setItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showNewItem, setShowNewItem] = useState(false)

  const selectedItem = useMemo(() => items.find(i => i.id === itemId), [items, itemId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!itemId || !quantity || Number(quantity) <= 0 || !date) return

    setSubmitting(true)
    setError('')

    try {
      const qty = Number(quantity)
      if (entryMode === 'adjustment') {
        const currentStockItem = stock.find(s => s.item_id === itemId)
        const currentQty = currentStockItem ? currentStockItem.current_stock : 0
        const diff = qty - currentQty

        if (diff === 0) {
          setSubmitting(false)
          resetForm()
          onSuccess()
          return
        }

        if (diff > 0) {
          // Need to add stock
          const entry = {
            school_id: profile?.school_id || 'mock-school-1',
            item_id: itemId,
            qty_added: diff,
            entry_date: date,
            notes: `Manual Adjustment: ${notes}`,
            created_by: profile?.id || 'mock-user'
          }
          if (isMockMode()) mockDb.saveStockEntry(entry)
          else await supabase.from('stock_entries').insert(entry)
        } else {
          // Need to remove stock (log usage)
          const usageLog = {
            school_id: profile?.school_id || 'mock-school-1',
            item_id: itemId,
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
          item_id: itemId,
          qty_added: qty,
          entry_date: date,
          notes,
          created_by: profile?.id || 'mock-user'
        }
        if (isMockMode()) mockDb.saveStockEntry(entry)
        else await supabase.from('stock_entries').insert(entry)
      }

      setSubmitting(false)
      resetForm()
      onSuccess()
    } catch (err) {
      setError('Failed to record stock. Please try again.')
      setSubmitting(false)
    }
  }

  function resetForm() {
    setEntryMode('incoming')
    setItemId('')
    setQuantity('')
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
                <label htmlFor="stockItem" className="block text-[11px] font-medium text-app-textSecondary">
                  Grocery Item
                </label>
                <button 
                  type="button" 
                  onClick={() => setShowNewItem(true)}
                  className="text-[11px] text-app-greenMid hover:underline"
                >
                  + Add New Catalog Item
                </button>
              </div>
              <SearchableDropdown
                items={items}
                value={itemId}
                onChange={setItemId}
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="stockQty" className="mb-1.5 block text-[11px] font-medium text-app-textSecondary uppercase tracking-wide">
                  {entryMode === 'incoming' ? 'Quantity Added' : 'Actual Count'} {selectedItem ? `(${selectedItem.unit})` : ''}
                </label>
                <input
                  id="stockQty"
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 50"
                  className="h-[36px] w-full rounded-[6px] border border-app-border bg-white px-3 text-[13px] text-app-textPrimary focus:border-app-greenMid focus:outline-none"
                />
              </div>
              
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
