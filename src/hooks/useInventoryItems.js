import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function useInventoryItems() {
  const { profile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!profile?.school_id) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error: nextError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('school_id', profile.school_id)
      .eq('is_active', true)
      .order('name')

    if (nextError) {
      setError('Could not load items. Try refreshing.')
      setItems([])
    } else {
      setError(null)
      setItems(data ?? [])
    }

    setLoading(false)
  }, [profile?.school_id])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { items, loading, error, refetch }
}
