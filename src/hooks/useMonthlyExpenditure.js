import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useMonthlyExpenditure(schoolId, monthYear) {
  const [usageLogs, setUsageLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchExpenditures = useCallback(async () => {
    if (!schoolId || !monthYear) {
      setUsageLogs([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    // monthYear is 'YYYY-MM'
    const startOfMonth = `${monthYear}-01`
    
    // Calculate end of month
    const [year, month] = monthYear.split('-')
    const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0] // last day of month

    const { data, error } = await supabase
      .from('usage_logs')
      .select('*, inventory_items(name_en, name_ta, unit)')
      .eq('school_id', schoolId)
      .gte('used_on', startOfMonth)
      .lte('used_on', endOfMonth)
      .order('used_on', { ascending: true })

    if (!error && data) {
      setUsageLogs(data)
    } else {
      setUsageLogs([])
    }
    setLoading(false)
  }, [schoolId, monthYear])

  useEffect(() => {
    fetchExpenditures()
  }, [fetchExpenditures])

  return { usageLogs, loading, refetch: fetchExpenditures }
}
