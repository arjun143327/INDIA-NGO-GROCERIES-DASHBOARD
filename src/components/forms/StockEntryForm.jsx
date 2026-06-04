import { useState, useMemo } from 'react'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'
import { isMockMode, mockDb } from '../../utils/mockDb'
import { useAuth } from '../../context/AuthContext'
import { useInventoryItems } from '../../hooks/useInventoryItems'
import NewItemForm from './NewItemForm'

export default function StockEntryForm({ open, onClose, onSuccess }) {
  const { profile } = useAuth()
  const { items, refetch } = useInventoryItems()
  
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

    const entry = {
      school_id: profile?.school_id || 'mock-school-1',
      item_id: itemId,
      qty_added: Number(quantity),
      entry_date: date,
      notes,
      created_by: profile?.id || 'mock-user'
    }

    try {
      if (isMockMode()) {
        setTimeout(() => {
          mockDb.saveStockEntry(entry)
          setSubmitting(false)
          resetForm()
          onSuccess()
        }, 300)
      } else {
        const { error: insertError } = await supabase.from('stock_entries').insert(entry)
        if (insertError) throw insertError

        setSubmitting(false)
        resetForm()
        onSuccess()
      }
    } catch (err) {
      setError('Failed to record stock. Please try again.')
      setSubmitting(false)
    }
  }

  function resetForm() {
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
      <Modal title="Record Incoming Stock" open={open && !showNewItem} onClose={onClose}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
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
              <select
                id="stockItem"
                required
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="h-[36px] w-full rounded-[6px] border border-app-border bg-white px-3 text-[13px] text-app-textPrimary focus:border-app-greenMid focus:outline-none"
              >
                <option value="" disabled>Select an item</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="stockQty" className="mb-1.5 block text-[11px] font-medium text-app-textSecondary uppercase tracking-wide">
                  Quantity {selectedItem ? `(${selectedItem.unit})` : ''}
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
