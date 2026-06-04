import { useMemo } from 'react'
import { stockStatus } from '../utils/stockStatus'

export function useAlerts(stock) {
  return useMemo(() => {
    const critical = []
    const low = []

    stock.forEach((item) => {
      const status = stockStatus(item.current_stock, item.threshold_qty)

      if (status === 'critical') {
        critical.push({ ...item, status })
      }

      if (status === 'low') {
        low.push({ ...item, status })
      }
    })

    return {
      critical,
      low,
      hasAlerts: critical.length > 0 || low.length > 0,
    }
  }, [stock])
}
