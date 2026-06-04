import { useState } from 'react'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'
import { isMockMode, mockDb } from '../../utils/mockDb'
import { useAuth } from '../../context/AuthContext'

export default function NewItemForm({ open, onClose, onSuccess }) {
  const { profile } = useAuth()
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('kg')
  const [threshold, setThreshold] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !threshold) return

    setSubmitting(true)
    setError('')

    const newItem = {
      name: name.trim(),
      unit,
      threshold_qty: Number(threshold),
      school_id: profile?.school_id || 'mock-school-1',
      is_active: true
    }

    try {
      if (isMockMode()) {
        setTimeout(() => {
          mockDb.saveItem(newItem)
          setSubmitting(false)
          setName('')
          setThreshold('')
          onSuccess()
        }, 300)
      } else {
        const { error: insertError } = await supabase.from('inventory_items').insert(newItem)
        if (insertError) throw insertError

        setSubmitting(false)
        setName('')
        setThreshold('')
        onSuccess()
      }
    } catch (err) {
      setError('Failed to add item. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Add New Grocery Item" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="itemName" className="mb-1.5 block text-[11px] font-medium text-app-textSecondary">
              Item Name
            </label>
            <input
              id="itemName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rice, Dal"
              className="h-[34px] w-full rounded-lg border border-app-border bg-white px-3 text-[12px] text-app-textPrimary focus:border-app-greenMid focus:outline-none focus:ring-1 focus:ring-app-greenMid"
            />
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
                className="h-[34px] w-full rounded-lg border border-app-border bg-white px-3 text-[12px] text-app-textPrimary focus:border-app-greenMid focus:outline-none focus:ring-1 focus:ring-app-greenMid"
              >
                <option value="kg">kg</option>
                <option value="litres">litres</option>
                <option value="packets">packets</option>
                <option value="units">units</option>
              </select>
            </div>
            
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
                placeholder="e.g. 10"
                className="h-[34px] w-full rounded-lg border border-app-border bg-white px-3 text-[12px] text-app-textPrimary focus:border-app-greenMid focus:outline-none focus:ring-1 focus:ring-app-greenMid"
              />
            </div>
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
