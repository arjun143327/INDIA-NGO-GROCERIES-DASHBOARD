import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function mapStockEntry(entry) {
  return {
    id: entry.id,
    type: 'stock',
    qty: entry.qty_added,
    created_at: entry.created_at,
    entry_date: entry.entry_date,
    date: entry.entry_date,
    total_expense: entry.total_expense,
    notes: entry.notes,
    item_name: entry.inventory_items?.name_en ?? 'Unknown item',
    unit: entry.inventory_items?.unit ?? '',
    category: entry.inventory_items?.category ?? 'Other',
  }
}

function mapUsageEntry(entry) {
  return {
    id: entry.id,
    type: 'usage',
    qty: entry.qty_used,
    created_at: entry.created_at,
    date: entry.used_on,
    notes: entry.notes,
    item_name: entry.inventory_items?.name_en ?? 'Unknown item',
    unit: entry.inventory_items?.unit ?? '',
    meal_type: entry.meal_type,
  }
}

function mapPriceUpdateEntry(entry, isFromStockUpdate = false) {
  return {
    id: entry.id,
    type: 'price_update',
    update_reason: isFromStockUpdate ? 'stock_update' : 'manual_update',
    old_price: entry.old_price,
    new_price: entry.new_price,
    created_at: entry.created_at,
    date: entry.created_at,
    item_name: entry.inventory_items?.name_en ?? 'Unknown item',
    category: entry.inventory_items?.category ?? 'Other',
  }
}

export function useActivityFeed(limit = 10, schoolId = null) {
  const { profile } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!profile) {
      setEntries([])
      setLoading(false)
      return
    }

    setLoading(true)

    const stockQuery = supabase
      .from('stock_entries')
      .select('id, item_id, created_at, entry_date, notes, total_expense, qty_added, inventory_items(name_en, unit, category)')
      .order('created_at', { ascending: false })
      .limit(limit)

    const usageQuery = supabase
      .from('usage_logs')
      .select('id, created_at, used_on, notes, qty_used, meal_type, inventory_items(name_en, unit)')
      .order('created_at', { ascending: false })
      .limit(limit)

    const priceQuery = supabase
      .from('price_updates')
      .select('id, item_id, created_at, old_price, new_price, inventory_items(name_en, category)')
      .order('created_at', { ascending: false })
      .limit(limit)

    let scopedStockQuery = stockQuery
    let scopedUsageQuery = usageQuery
    let scopedPriceQuery = priceQuery

    if (profile.role === 'school_staff') {
      scopedStockQuery = stockQuery.eq('school_id', profile.school_id)
      scopedUsageQuery = usageQuery.eq('school_id', profile.school_id)
      scopedPriceQuery = priceQuery.eq('school_id', profile.school_id)
    } else if (schoolId) {
      scopedStockQuery = stockQuery.eq('school_id', schoolId)
      scopedUsageQuery = usageQuery.eq('school_id', schoolId)
      scopedPriceQuery = priceQuery.eq('school_id', schoolId)
    }

    const [stockResponse, usageResponse, priceResponse] = await Promise.all([scopedStockQuery, scopedUsageQuery, scopedPriceQuery])

    if (stockResponse.error || usageResponse.error || priceResponse.error) {
      setError('Could not load activity. Try refreshing.')
      setEntries([])
      setLoading(false)
      return
    }

    const stockData = stockResponse.data ?? []
    const priceData = priceResponse.data ?? []

    const mappedPriceData = priceData.map((entry) => {
      const entryTime = new Date(entry.created_at).getTime()
      const isFromStockUpdate = stockData.some(s => {
        const sTime = new Date(s.created_at).getTime()
        // Check if same item and time difference is within 60 seconds (60000ms)
        return s.item_id === entry.item_id && Math.abs(sTime - entryTime) < 60000
      })
      return mapPriceUpdateEntry(entry, isFromStockUpdate)
    })

    const merged = [
      ...stockData.map(mapStockEntry), 
      ...(usageResponse.data ?? []).map(mapUsageEntry),
      ...mappedPriceData
    ]
      .sort((left, right) => new Date(right.created_at) - new Date(left.created_at))
      .slice(0, limit)

    setError(null)
    setEntries(merged)
    setLoading(false)
  }, [limit, profile, schoolId])

  useEffect(() => {
    refetch()

    if (!profile) return

    const channel = supabase.channel(`feed_updates_${Math.random().toString(36).substr(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_entries' }, () => {
        refetch()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usage_logs' }, () => {
        refetch()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'price_updates' }, () => {
        refetch()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refetch, profile])

  return { entries, loading, error, refetch }
}
