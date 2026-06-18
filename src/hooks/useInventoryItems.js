import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function useInventoryItems() {
  const { profile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (profile?.role !== 'ngo_admin' && !profile?.school_id) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)

    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true)
      .order('name_en')

    //Only filter by school if they are school staff
    if (profile?.role === 'school_staff') {
      query = query.eq('school_id', profile.school_id)
    }

    const { data, error: nextError} = await query

    if (nextError) {
      setError('Could not load items. Try refreshing.')
      setItems([])
    } else {
      setError(null)
      setItems(data ?? [])
    }

    setLoading(false)
  }, [profile?.school_id, profile?.role])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { items, loading, error, refetch }
}
