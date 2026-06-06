import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { isMockMode, mockDb } from '../utils/mockDb'

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

    if (isMockMode()) {
      setTimeout(() => {
        const data = mockDb.getItems().filter(i => i.is_active)
        setItems(data)
        setLoading(false)
      }, 300)
      return
    }

    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true)
      .order('name')

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
    
    if (isMockMode()) {
      const handleMockUpdate = () => refetch()
      window.addEventListener('mock-db-update', handleMockUpdate)
      return () => window.removeEventListener('mock-db-update', handleMockUpdate)
    }
  }, [refetch])

  return { items, loading, error, refetch }
}
