import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { isMockMode, mockDb } from '../utils/mockDb'

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

    if (isMockMode()) {
      setTimeout(() => {
        const data = mockDb.getCurrentStock()
        setStock(data)
        setLoading(false)
      }, 300); //300ms to simulate network latency
      return
    }

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
    
    if (isMockMode()) {
      const handleMockUpdate = () => refetch()
      window.addEventListener('mock-db-update', handleMockUpdate)
      return () => window.removeEventListener('mock-db-update', handleMockUpdate)
    }
  }, [refetch])

  return { stock, loading, error, refetch }
}
