import { useState } from 'react'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'
import { isMockMode, mockDb } from '../../utils/mockDb'
import { useAuth } from '../../context/AuthContext'
import { useCurrentStock } from '../../hooks/useCurrentStock'
import { Trash2, Plus } from 'lucide-react'

export default function UsageEntryForm({ open, onClose, onSuccess }) {
  const { profile } = useAuth()
  const { stock } = useCurrentStock()
  
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [mealType, setMealType] = useState('Lunch')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ id: Date.now(), item_id: '', quantity: '' }])
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function addItemRow() {
    setItems([...items, { id: Date.now(), item_id: '', quantity: '' }])
  }

  function removeItemRow(id) {
    if (items.length === 1) return
    setItems(items.filter(item => item.id !== id))
  }

  function updateItem(id, field, value) {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    // Validation
    if (!date) return
    const isValid = items.every(item => item.item_id && item.quantity && Number(item.quantity) > 0)
    if (!isValid) {
      setError('Please fill all item fields with valid quantities.')
      return
    }

    setSubmitting(true)
    setError('')

    const logs = items.map(item => ({
      school_id: profile?.school_id || 'mock-school-1',
      item_id: item.item_id,
      qty_used: Number(item.quantity),
      used_on: date,
      meal_type: mealType,
      notes,
      created_by: profile?.id || 'mock-user'
    }))

    try {
      if (isMockMode()) {
        setTimeout(() => {
          logs.forEach(log => mockDb.saveUsageLog(log))
          setSubmitting(false)
          resetForm()
          onSuccess()
        }, 300)
      } else {
        const { error: insertError } = await supabase.from('usage_logs').insert(logs)
        if (insertError) throw insertError

        setSubmitting(false)
        resetForm()
        onSuccess()
      }
    } catch (err) {
      setError('Failed to log usage. Please try again.')
      setSubmitting(false)
    }
  }

  function resetForm() {
    setDate(new Date().toISOString().split('T')[0])
    setMealType('Lunch')
    setNotes('')
    setItems([{ id: Date.now(), item_id: '', quantity: '' }])
  }

  // To prevent selecting the same item twice
  const selectedItemIds = items.map(i => i.item_id).filter(Boolean)

  return (
    <Modal title="Log Daily Usage" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 -mx-1">
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="usageDate" className="mb-1.5 block text-[11px] font-medium text-app-textSecondary">
                Date
              </label>
              <input
                id="usageDate"
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-[34px] w-full rounded-lg border border-app-border bg-white px-3 text-[12px] text-app-textPrimary focus:border-app-greenMid focus:outline-none focus:ring-1 focus:ring-app-greenMid"
              />
            </div>
            
            <div className="flex-1">
              <label htmlFor="mealType" className="mb-1.5 block text-[11px] font-medium text-app-textSecondary">
                Meal Type
              </label>
              <select
                id="mealType"
                required
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="h-[34px] w-full rounded-lg border border-app-border bg-white px-3 text-[12px] text-app-textPrimary focus:border-app-greenMid focus:outline-none focus:ring-1 focus:ring-app-greenMid"
              >
                <option value="Lunch">Lunch</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Snack">Snack</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-[11px] font-medium text-app-textSecondary">
              Items Consumed
            </label>
            
            {items.map((item, index) => {
              const selectedStockItem = stock.find(s => s.item_id === item.item_id)
              const warning = selectedStockItem && Number(item.quantity) > selectedStockItem.current_stock
              
              return (
                <div key={item.id} className="relative rounded-lg border border-app-border p-3 bg-app-surfaceAlt/50">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <select
                        required
                        value={item.item_id}
                        onChange={(e) => updateItem(item.id, 'item_id', e.target.value)}
                        className="h-[34px] w-full rounded-lg border border-app-border bg-white px-3 text-[12px] text-app-textPrimary focus:border-app-greenMid focus:outline-none focus:ring-1 focus:ring-app-greenMid"
                      >
                        <option value="" disabled>Select item</option>
                        {stock.map(s => (
                          <option 
                            key={s.item_id} 
                            value={s.item_id}
                            disabled={selectedItemIds.includes(s.item_id) && s.item_id !== item.item_id}
                          >
                            {s.item_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="w-[100px]">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          required
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="h-[34px] w-full rounded-lg border border-app-border bg-white pl-3 pr-8 text-[12px] text-app-textPrimary focus:border-app-greenMid focus:outline-none focus:ring-1 focus:ring-app-greenMid"
                        />
                        {selectedStockItem && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-app-textSecondary">
                            {selectedStockItem.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    {items.length > 1 && (
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
                  
                  {warning && (
                    <p className="mt-1.5 text-[11px] text-app-amber">
                      Warning: Exceeds current stock (Available: {selectedStockItem.current_stock} {selectedStockItem.unit})
                    </p>
                  )}
                </div>
              )
            })}

            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-1.5 text-[12px] font-medium text-app-greenMid hover:underline"
            >
              <Plus size={14} />
              Add another item
            </button>
          </div>

          <div className="pt-2">
            <label htmlFor="usageNotes" className="mb-1.5 block text-[11px] font-medium text-app-textSecondary">
              Notes (Optional)
            </label>
            <textarea
              id="usageNotes"
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Extra students today"
              className="w-full rounded-lg border border-app-border bg-white p-3 text-[12px] text-app-textPrimary focus:border-app-greenMid focus:outline-none focus:ring-1 focus:ring-app-greenMid"
            ></textarea>
          </div>
        </div>

        {error && <p className="mt-3 text-[12px] text-app-red">{error}</p>}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-app-border">
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
            {submitting ? 'Saving...' : 'Save Usage'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
