import { useState } from 'react'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'
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
  
  const [entryItems, setEntryItems] = useState([{ id: Date.now(), item_id: '', quantity: '', expense: '', category_filter: 'All' }])
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showNewItem, setShowNewItem] = useState(false)

  // To prevent selecting the same item twice
  const selectedItemIds = entryItems.map(i => i.item_id).filter(Boolean)

  async function handleSubmit(e) {
    e.preventDefault()
    
    const validItems = entryItems.filter(i => i.item_id && i.quantity && Number(i.quantity) > 0)
    if (validItems.length === 0 || !date) return

    setSubmitting(true)
    setError('')

    try {
      for (const item of validItems) {
        const qty = Number(item.quantity)
        const expense = Number(item.expense) || 0
        
        // Standard incoming stock with expense
        const entry = {
          school_id: profile?.school_id,
          item_id: item.item_id,
          qty_added: qty,
          entry_date: date,
          total_expense: expense,
          notes,
          created_by: profile?.id
        }
        const { error: insertError } = await supabase.from('stock_entries').insert(entry)
        if (insertError) throw insertError

        // Automatically save the price info to the inventory table
        if (expense > 0) {
          const selectedStockItem = stock.find(s => s.item_id === item.item_id)
          const previousCost = Number(selectedStockItem?.estimated_cost) || 0
          const exactPrice = Math.round(expense)
          const calcUnitPrice = Number((expense / qty).toFixed(2))

          await supabase.from('inventory_items').update({ 
            estimated_cost: exactPrice, 
            unit_price: calcUnitPrice 
          }).eq('id', item.item_id)
          
          // Also log it in price_updates for history
          await supabase.from('price_updates').insert({
            school_id: profile?.school_id,
            item_id: item.item_id,
            old_price: previousCost,
            new_price: exactPrice,
            updated_by: profile?.id
          })
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
    setEntryItems(prev => [...prev, { id: Date.now(), item_id: '', quantity: '', expense: '', category_filter: 'All' }])
  }

  function removeItemRow(id) {
    setEntryItems(prev => prev.filter(item => item.id !== id))
  }

  function resetForm() {
    setEntryItems([{ id: Date.now(), item_id: '', quantity: '', expense: '', category_filter: 'All' }])
    setDate(new Date().toISOString().split('T')[0])
    setNotes('')
  }

  function handleNewItemSuccess() {
    setShowNewItem(false)
    refetch()
  }

  // Calculate total expense across all rows
  const totalExpense = entryItems.reduce((sum, i) => sum + (Number(i.expense) || 0), 0)

  return (
    <>
      <Modal title="Manage Stock Levels" open={open && !showNewItem} onClose={onClose} maxWidthClass="max-w-[640px]">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* Column Headers */}
            <div className="flex gap-2 px-1">
              <div className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-app-textSecondary">Item</div>
              <div className="w-[110px] text-[10px] font-semibold uppercase tracking-wide text-app-textSecondary">Qty</div>
              <div className="w-[110px] text-[10px] font-semibold uppercase tracking-wide text-app-textSecondary">Expense (₹)</div>
              <div className="w-7" /> {/* spacer for trash button */}
            </div>

            <div>
              <div className="mb-1.5 flex justify-between items-center">
                <button 
                  type="button" 
                  onClick={() => setShowNewItem(true)}
                  className="text-[11px] text-app-greenMid hover:underline"
                >
                  + Add New Catalog Item
                </button>
              </div>
              
              <div className="space-y-2 px-1 -mx-1">
                {entryItems.map((item) => {
                  const selectedStockItem = items.find(i => i.id === item.item_id)
                  
                  return (
                    <div key={item.id} className="relative rounded-[8px] border border-app-border bg-gray-50/50 p-3">
                      <CategoryChips 
                        selectedCategory={item.category_filter} 
                        onSelectCategory={(val) => updateItem(item.id, 'category_filter', val)} 
                      />
                      <div className="flex gap-2 items-center mt-2">
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
                        
                        {/* Qty */}
                        <div className="w-[110px]">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                              placeholder="Qty"
                              className="h-[34px] w-full rounded-[6px] border border-app-border bg-white pl-3 pr-[40px] text-[12px] text-app-textPrimary focus:border-app-greenMid focus:outline-none"
                            />
                            {selectedStockItem && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-app-textSecondary">
                                {selectedStockItem.unit}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expense */}
                        <div className="w-[110px]">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-app-textSecondary">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.expense}
                              onChange={(e) => updateItem(item.id, 'expense', e.target.value)}
                              placeholder="0"
                              className="h-[34px] w-full rounded-[6px] border border-app-border bg-white pl-6 pr-2 text-[12px] text-app-textPrimary focus:border-app-greenMid focus:outline-none"
                            />
                          </div>
                        </div>

                        {entryItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(item.id)}
                            className="flex h-7 w-7 items-center justify-center rounded text-app-textSecondary hover:bg-app-redBg hover:text-app-red transition-colors flex-shrink-0"
                            aria-label="Remove item"
                          >
                            <Trash2 size={15} />
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

            <div className="flex gap-4 pt-1">
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
              {totalExpense > 0 && (
                <div className="flex-1 flex items-end">
                  <div className="w-full rounded-[6px] bg-app-greenLight border border-app-greenMid/20 px-3 py-2 text-right">
                    <div className="text-[10px] text-app-greenMid uppercase tracking-wide font-semibold">Total Expense</div>
                    <div className="text-[16px] font-bold text-app-greenDark">₹{totalExpense.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="stockNotes" className="mb-1.5 block text-[11px] font-medium text-app-textSecondary">
                Notes (Optional)
              </label>
              <textarea
                id="stockNotes"
                rows="2"
                maxLength={250}
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
              className="h-[36px] rounded-lg border border-app-border bg-white px-5 text-[13px] font-semibold text-app-textPrimary hover:bg-app-surfaceAlt"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-[36px] rounded-lg bg-app-greenMid px-5 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
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
