import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {isMockMode} from '../utils/mockDb'

export function useRealtimeStock(onUpdate) {
  useEffect(() => {
    if (isMockMode()){
      window.addEventListener('mock-db-update', onUpdate)
      return () => window.removeEventListener('mock-db-update' , onUpdate)
    } 

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
