import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function useCurrentStock(schoolId = null) {
  const { profile } = useAuth()
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!profile) {
      setStock([])
      setLoading(false)
      return
    }

    setLoading(true)

    let query = supabase.from('current_stock_view').select('*').order('item_name')

    if (profile.role === 'school_staff') {
      query = query.eq('school_id', profile.school_id)
    } else if (schoolId) {
      query = query.eq('school_id', schoolId)
    }

    const { data, error: nextError } = await query

    if (nextError) {
      setError('Could not load stock. Try refreshing.')
      setStock([])
    } else {
      setError(null)
      setStock(data ?? [])
    }

    setLoading(false)
  }, [profile, schoolId])

  useEffect(() => {
    refetch()

    if (!profile) return

    const channel = supabase.channel(`dashboard_updates_${Math.random().toString(36).substr(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
        refetch()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_entries' }, () => {
        refetch()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usage_logs' }, () => {
        refetch()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refetch, profile])

  return { stock, loading, error, refetch }
}
