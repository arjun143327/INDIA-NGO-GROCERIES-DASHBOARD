import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { isMockMode, mockDb } from '../utils/mockDb'

function mapStockEntry(entry) {
  return {
    id: entry.id,
    type: 'stock',
    qty: entry.qty_added,
    created_at: entry.created_at,
    item_name: entry.inventory_items?.name_en ?? 'Unknown item',
    unit: entry.inventory_items?.unit ?? '',
  }
}

function mapUsageEntry(entry) {
  return {
    id: entry.id,
    type: 'usage',
    qty: entry.qty_used,
    created_at: entry.created_at,
    item_name: entry.inventory_items?.name_en ?? 'Unknown item',
    unit: entry.inventory_items?.unit ?? '',
    meal_type: entry.meal_type,
  }
}

function mapPriceUpdateEntry(entry) {
  return {
    id: entry.id,
    type: 'price_update',
    old_price: entry.old_price,
    new_price: entry.new_price,
    created_at: entry.created_at,
    item_name: entry.inventory_items?.name_en ?? 'Unknown item',
  }
}

export function useActivityFeed(limit = 10) {
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

    if (isMockMode()) {
      setTimeout(() => {
        const data = mockDb.getActivityFeed(limit)
        setEntries(data)
        setLoading(false)
      }, 300)
      return
    }

    const stockQuery = supabase
      .from('stock_entries')
      .select('id, created_at, qty_added, inventory_items(name_en, unit)')
      .order('created_at', { ascending: false })
      .limit(limit)

    const usageQuery = supabase
      .from('usage_logs')
      .select('id, created_at, qty_used, meal_type, inventory_items(name_en, unit)')
      .order('created_at', { ascending: false })
      .limit(limit)

    const priceQuery = supabase
      .from('price_updates')
      .select('id, created_at, old_price, new_price, inventory_items(name_en)')
      .order('created_at', { ascending: false })
      .limit(limit)

    const scopedStockQuery =
      profile.role === 'school_staff' ? stockQuery.eq('school_id', profile.school_id) : stockQuery
    const scopedUsageQuery =
      profile.role === 'school_staff' ? usageQuery.eq('school_id', profile.school_id) : usageQuery
    const scopedPriceQuery =
      profile.role === 'school_staff' ? priceQuery.eq('school_id', profile.school_id) : priceQuery

    const [stockResponse, usageResponse, priceResponse] = await Promise.all([scopedStockQuery, scopedUsageQuery, scopedPriceQuery])

    if (stockResponse.error || usageResponse.error || priceResponse.error) {
      setError('Could not load activity. Try refreshing.')
      setEntries([])
      setLoading(false)
      return
    }

    const merged = [
      ...(stockResponse.data ?? []).map(mapStockEntry), 
      ...(usageResponse.data ?? []).map(mapUsageEntry),
      ...(priceResponse.data ?? []).map(mapPriceUpdateEntry)
    ]
      .sort((left, right) => new Date(right.created_at) - new Date(left.created_at))
      .slice(0, limit)

    setError(null)
    setEntries(merged)
    setLoading(false)
  }, [limit, profile])

  useEffect(() => {
    refetch()
    
    if (isMockMode()) {
      const handleMockUpdate = () => refetch()
      window.addEventListener('mock-db-update', handleMockUpdate)
      return () => window.removeEventListener('mock-db-update', handleMockUpdate)
    }
  }, [refetch])

  return { entries, loading, error, refetch }
}
