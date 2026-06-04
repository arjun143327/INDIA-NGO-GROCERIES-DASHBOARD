import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function useCurrentStock() {
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
  }, [profile])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { stock, loading, error, refetch }
}
