import { useState } from 'react'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function NewItemForm({ open, onClose, onSuccess }) {
  const { profile } = useAuth()
  const isSchoolStaff = profile?.role === 'school_staff'
  const [nameEn, setNameEn] = useState('')
  const [category, setCategory] = useState('Masala / Spices')
  const [unit, setUnit] = useState('kg')
  const [threshold, setThreshold] = useState('0') // Default to 0
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nameEn.trim() || !threshold) return

    setSubmitting(true)
    setError('')

    const newItem = {
      name_en: nameEn.trim(),
      name_ta: '',
      category,
      unit,
      threshold_qty: Number(threshold),
      school_id: profile?.school_id,
      is_active: true
    }

    try {
      const { error: insertError } = await supabase.from('inventory_items').insert(newItem)
      if (insertError) throw insertError

      setSubmitting(false)
      reset()
      onSuccess()
    } catch (err) {
      setError('Failed to add item. Please try again.')
      setSubmitting(false)
    }
  }

  function reset() {
    setNameEn('')
    setCategory('Masala / Spices')
    setThreshold('0')
  }

  return (
    <Modal title="Add New Grocery Item" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="itemNameEn" className="mb-1.5 block text-[11px] font-medium text-app-textSecondary">
              Item Name
            </label>
            <input
              id="itemNameEn"
              type="text"
              required
              maxLength={100}
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Tomato"
              className="h-[36px] w-full rounded-[6px] border border-app-border bg-white px-3 text-[13px] text-app-textPrimary focus:border-app-greenMid focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="itemCategory" className="mb-1.5 block text-[11px] font-medium text-app-textSecondary">
                Category
              </label>
              <select
                id="itemCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-[36px] w-full rounded-[6px] border border-app-border bg-white px-3 text-[13px] text-app-textPrimary focus:border-app-greenMid focus:outline-none"
              >
                <option value="Masala / Spices">Masala / Spices</option>
                <option value="Rice Items">Rice Items</option>
                <option value="Flour Items">Flour Items</option>
                <option value="Milk / Health Drink">Milk / Health Drink</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Snacks / Side Items">Snacks / Side Items</option>
                <option value="Dal / Pulses">Dal / Pulses</option>
                <option value="Oil / Ghee">Oil / Ghee</option>
                <option value="Sweet Items">Sweet Items</option>
                <option value="Other Items">Other Items</option>
                <option value="Greens / Leaves">Greens / Leaves</option>
                <option value="Fruits">Fruits</option>
                <option value="Non-Veg Items">Non-Veg Items</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="itemUnit" className="mb-1.5 block text-[11px] font-medium text-app-textSecondary">
                Unit
              </label>
              <select
                id="itemUnit"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-[36px] w-full rounded-[6px] border border-app-border bg-white px-3 text-[13px] text-app-textPrimary focus:border-app-greenMid focus:outline-none"
              >
                <option value="kg">kg</option>
                <option value="grams">grams</option>
                <option value="L">L (litre)</option>
                <option value="packets">packets</option>
                <option value="nos">nos</option>
              </select>
            </div>
          </div>
          
          {!isSchoolStaff && (
            <div>
              <label htmlFor="itemThreshold" className="mb-1.5 block text-[11px] font-medium text-app-textSecondary">
                Low Alert Threshold
              </label>
              <input
                id="itemThreshold"
                type="number"
                min="0"
                step="0.1"
                required
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="e.g. 0"
                className="h-[36px] w-full rounded-[6px] border border-app-border bg-white px-3 text-[13px] text-app-textPrimary focus:border-app-greenMid focus:outline-none"
              />
            </div>
          )}
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
            {submitting ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
