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
    item_name: entry.inventory_items?.name ?? 'Unknown item',
    unit: entry.inventory_items?.unit ?? '',
  }
}

function mapUsageEntry(entry) {
  return {
    id: entry.id,
    type: 'usage',
    qty: entry.qty_used,
    created_at: entry.created_at,
    item_name: entry.inventory_items?.name ?? 'Unknown item',
    unit: entry.inventory_items?.unit ?? '',
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
      .select('id, created_at, qty_added, inventory_items(name, unit)')
      .order('created_at', { ascending: false })
      .limit(limit)

    const usageQuery = supabase
      .from('usage_logs')
      .select('id, created_at, qty_used, inventory_items(name, unit)')
      .order('created_at', { ascending: false })
      .limit(limit)

    const scopedStockQuery =
      profile.role === 'school_staff' ? stockQuery.eq('school_id', profile.school_id) : stockQuery
    const scopedUsageQuery =
      profile.role === 'school_staff' ? usageQuery.eq('school_id', profile.school_id) : usageQuery

    const [stockResponse, usageResponse] = await Promise.all([scopedStockQuery, scopedUsageQuery])

    if (stockResponse.error || usageResponse.error) {
      setError('Could not load activity. Try refreshing.')
      setEntries([])
      setLoading(false)
      return
    }

    const merged = [...(stockResponse.data ?? []).map(mapStockEntry), ...(usageResponse.data ?? []).map(mapUsageEntry)]
      .sort((left, right) => new Date(right.created_at) - new Date(left.created_at))
      .slice(0, limit)

    setError(null)
    setEntries(merged)
    setLoading(false)
  }, [limit, profile])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { entries, loading, error, refetch }
}
