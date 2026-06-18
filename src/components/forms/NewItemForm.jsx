import { useState } from 'react'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function NewItemForm({ open, onClose, onSuccess }) {
  const { profile } = useAuth()
  const isSchoolStaff = profile?.role === 'school_staff'
  const [nameEn, setNameEn] = useState('')
  const [nameTa, setNameTa] = useState('')
  const [category, setCategory] = useState('Household / utility')
  const [unit, setUnit] = useState('kg')
  const [threshold, setThreshold] = useState('0') // Default to 0
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nameEn.trim() || !nameTa.trim() || !threshold) return

    setSubmitting(true)
    setError('')

    const newItem = {
      name_en: nameEn.trim(),
      name_ta: nameTa.trim(),
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
    setNameTa('')
    setCategory('Household / utility')
    setThreshold('0')
  }

  return (
    <Modal title="Add New Grocery Item" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="itemNameEn" className="mb-1.5 block text-[11px] font-medium text-app-textSecondary">
                English Name
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
            <div className="flex-1">
              <label htmlFor="itemNameTa" className="mb-1.5 block text-[11px] font-medium text-app-textSecondary">
                Tamil Name
              </label>
              <input
                id="itemNameTa"
                type="text"
                required
                maxLength={100}
                value={nameTa}
                onChange={(e) => setNameTa(e.target.value)}
                placeholder="e.g. தக்காளி"
                className="h-[36px] w-full rounded-[6px] border border-app-border bg-white px-3 text-[13px] text-app-textPrimary focus:border-app-greenMid focus:outline-none"
              />
            </div>
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
                <option value="Rice & grains">Rice & grains</option>
                <option value="Dal / pulses">Dal / pulses</option>
                <option value="Spices & masala">Spices & masala</option>
                <option value="Oils & fats">Oils & fats</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Dairy & protein">Dairy & protein</option>
                <option value="Snacks / packaged items">Snacks / packaged items</option>
                <option value="Household / utility">Household / utility</option>
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
          
          <div className="flex gap-3">
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
            
            {!isSchoolStaff && (
              <div className="flex-1">
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
