import { useState, useCallback } from 'react'
import StatCard from '../../components/ui/StatCard'
import AlertStrip from '../../components/ui/AlertStrip'
import ProgressBar from '../../components/ui/ProgressBar'
import StatusPill from '../../components/ui/StatusPill'
import ActivityRow from '../../components/ui/ActivityRow'
import { useCurrentStock } from '../../hooks/useCurrentStock'
import { useAlerts } from '../../hooks/useAlerts'
import { useActivityFeed } from '../../hooks/useActivityFeed'
import { useRealtimeStock } from '../../hooks/useRealtimeStock'
import { stockStatus } from '../../utils/stockStatus'
import StockEntryForm from '../../components/forms/StockEntryForm'
import UsageEntryForm from '../../components/forms/UsageEntryForm'

export default function SchoolDashboard() {
  const [activeModal, setActiveModal] = useState(null)
  
  // Data hooks
  const { stock, loading: stockLoading, refetch: refetchStock } = useCurrentStock()
  const { entries, loading: feedLoading, refetch: refetchFeed } = useActivityFeed(10)
  const { critical, low, hasAlerts } = useAlerts(stock)

  // Realtime subscription (or mock window events)
  const handleUpdate = useCallback(() => {
    refetchStock()
    refetchFeed()
  }, [refetchStock, refetchFeed])
  
  useRealtimeStock(handleUpdate)

  const handleModalSuccess = () => {
    setActiveModal(null)
    handleUpdate()
  }

  return (
    <div className="space-y-4">
      {/* Header and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[16px] font-semibold text-app-textPrimary">School Dashboard</h1>
          <p className="mt-1 text-[12px] text-app-textSecondary">
            Manage your daily inventory and usage.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveModal('stock')}
            className="h-[32px] rounded-lg bg-app-greenMid px-4 text-[12px] font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            Record Incoming Stock
          </button>
          <button
            onClick={() => setActiveModal('usage')}
            className="h-[32px] rounded-lg border border-app-border bg-white px-4 text-[12px] font-semibold text-app-textPrimary shadow-sm hover:bg-app-surfaceAlt transition-colors"
          >
            Log Daily Usage
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Total Items" value={stockLoading ? '--' : stock.length} colour="text-app-greenMid" />
        <StatCard label="Low Stock" value={stockLoading ? '--' : low.length} colour="text-app-amber" />
        <StatCard label="Critical" value={stockLoading ? '--' : critical.length} colour="text-app-red" />
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <div className="overflow-hidden rounded-[10px] border border-app-border bg-app-surface">
          <div className="border-b border-app-border px-4 py-[14px]">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold text-app-textPrimary">
              <span className="text-app-amber">⚠</span> Needs Attention
            </h2>
          </div>
          <div className="flex flex-col">
            {critical.map((item) => (
              <AlertStrip key={item.item_id} item={item} />
            ))}
            {low.map((item) => (
              <AlertStrip key={item.item_id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Current Stock Table */}
      <div className="overflow-hidden rounded-[10px] border border-app-border bg-app-surface">
        <div className="border-b border-app-border px-4 py-[14px]">
          <h2 className="text-[13px] font-semibold text-app-textPrimary">Current Inventory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-app-border bg-app-surfaceAlt text-[10px] uppercase tracking-[0.4px] text-app-textSecondary">
                <th className="px-4 py-2.5 font-semibold">Item</th>
                <th className="px-4 py-2.5 font-semibold">In Stock</th>
                <th className="px-4 py-2.5 font-semibold">Threshold</th>
                <th className="px-4 py-2.5 font-semibold w-[100px]">Level</th>
                <th className="px-4 py-2.5 font-semibold w-[80px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {stockLoading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-center text-app-textSecondary">Loading stock...</td>
                </tr>
              ) : stock.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-center text-app-textSecondary">No inventory items tracked.</td>
                </tr>
              ) : (
                stock.map((item) => {
                  const status = stockStatus(item.current_stock, item.threshold_qty)
                  return (
                    <tr key={item.item_id} className="border-b border-app-border last:border-0 hover:bg-[#fafaf9]">
                      <td className="px-4 py-2.5 font-medium text-app-textPrimary">{item.item_name}</td>
                      <td className="px-4 py-2.5 text-app-textPrimary">{item.current_stock} {item.unit}</td>
                      <td className="px-4 py-2.5 text-app-textSecondary">{item.threshold_qty} {item.unit}</td>
                      <td className="px-4 py-2.5">
                        <ProgressBar stock={item.current_stock} threshold={item.threshold_qty} />
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusPill status={status} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="overflow-hidden rounded-[10px] border border-app-border bg-app-surface">
        <div className="border-b border-app-border px-4 py-[14px]">
          <h2 className="text-[13px] font-semibold text-app-textPrimary">Recent Activity</h2>
        </div>
        <div className="flex flex-col">
          {feedLoading ? (
            <div className="px-4 py-4 text-center text-[12px] text-app-textSecondary">Loading activity...</div>
          ) : entries.length === 0 ? (
            <div className="px-4 py-4 text-center text-[12px] text-app-textSecondary">No recent entries.</div>
          ) : (
            entries.map((entry) => (
              <ActivityRow key={`${entry.type}-${entry.id}`} entry={entry} />
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <StockEntryForm 
        open={activeModal === 'stock'} 
        onClose={() => setActiveModal(null)} 
        onSuccess={handleModalSuccess} 
      />
      <UsageEntryForm 
        open={activeModal === 'usage'} 
        onClose={() => setActiveModal(null)} 
        onSuccess={handleModalSuccess} 
      />
    </div>
  )
}

