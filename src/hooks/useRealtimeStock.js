import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtimeStock(onUpdate) {
  useEffect(() => {
    const channel = supabase
      .channel('stock-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stock_entries' }, onUpdate)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'usage_logs' }, onUpdate)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onUpdate])
}
