import { useState, useCallback } from 'react'
import { Search, Filter, AlertCircle, TrendingDown, TrendingUp, Package, ClipboardList, ArrowRightLeft, Activity, BarChart2 } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState('Overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setstatusFilter] = useState('All')
  const [activityTypeFilter, setActivityTypeFilter] = useState('All')
  const [reportRange, setReportRange] = useState('7days')
  
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
//Filter logic for the inventory tab
  const filteredStock = stock.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
    const status = stockStatus(item.current_stock, item.threshold_qty)
    const matchesStatus = statusFilter === 'All' || status === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })
  
  //filter logic for activity tab
  const filteredEntries = entries.filter((entry) => {
    if (activityTypeFilter === 'All') return true
    return entry.type === activityTypeFilter.toLowerCase()
  })
   
  
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
      {/* Tab navigation */}
          <div className = "flex border-b border-app-border">
            {['Overview', 'Inventory', 'Activity', 'Reports'].map((tab) =>(
              <button
                key = {tab}
                onClick = {() => setActiveTab(tab)}
                className = {`px-5 py-3 text-[13px] font-medium transition-colors
          ${
            activeTab === tab
              ? 'border-b-2 border-app-greenMid text-app-greenMid'
              : 'text-app-textSecondary hover:text-app-textPrimary'
              
          }`}
          >
          {tab}
          </button>
            ))}
          </div>

      {/*Tab content */}
      {activeTab === 'Overview' && (
         <div className="space-y-4">

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Total Items" value={stockLoading ? '--' : stock.length} colour="text-app-greenMid" />
        <StatCard label="Low Stock" value={stockLoading ? '--' : low.length} colour="text-app-amber" />
        <StatCard label="Critical" value={stockLoading ? '--' : critical.length} colour="text-app-red" />
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <div className="overflow-hidden rounded-[10px] border border-app-border bg-app-surface shadow-sm shadow-black/5">
          <div className="border-b border-app-border px-5 py-4 bg-[#fffaf5]">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold text-app-textPrimary">
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
        {/* double column preview grid */}
        <div className = "grid gap-4 md:grid-cols-2">
          {/* left column: inventory preview */}
          <div className="flex flex-col overflow-hidden rounded-[10px]
          border border-app-border bg-app-surface">
            <div className="border-b border-app-border px-4 py-[14px]">
              <h2 className = "text-[13px] font-semibold text-app-textPrimary">Inventory preview</h2>
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <tbody>
                    {stockLoading ? (
                      <tr><td className="p-4 text-center text-app-textSecondary">Loading...</td></tr>
                    ) : stock.slice(0, 6).map((item) => (
                      <tr key={item.item_id} className="border-b border-app-border last:border-0 hover:bg-[#fafaf9] transition-colors">
                        <td className="px-4 py-3 font-medium text-app-textPrimary">{item.item_name}</td>
                        <td className="px-4 py-3 text-right text-app-textSecondary">{item.current_stock} {item.unit}</td>


                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button 
                onClick={() => setActiveTab('Inventory')}
                className="border-t border-app-border bg-app-surfaceAlt py-2.5 text-center text-[11px] font-medium text-app-greenMid hover:bg-[#ecebe4] transition-colors"
              >
                View full inventory →
              </button>
            </div>
            {/* Right Column: Activity Preview */}
            <div className="flex flex-col overflow-hidden rounded-[10px] border border-app-border bg-app-surface">
              <div className="border-b border-app-border px-4 py-[14px]">
                <h2 className="text-[13px] font-semibold text-app-textPrimary">Recent Activity</h2>
              </div>
              <div className="flex flex-col flex-1">
                {feedLoading ? (
                  <div className="p-4 text-center text-[12px] text-app-textSecondary">Loading...</div>
                ) : entries.slice(0, 4).map((entry) => (
                  <ActivityRow key={`${entry.type}-${entry.id}`} entry={entry} />
                ))}
              </div>
              <button 
                onClick={() => setActiveTab('Activity')}
                className="border-t border-app-border bg-app-surfaceAlt py-2.5 text-center text-[11px] font-medium text-app-greenMid hover:bg-[#ecebe4] transition-colors"
              >
                View full activity log →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === 'Inventory' && (
        <div className="space-y-4">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[36px] flex-1 rounded-lg border border-app-border bg-white px-3 text-[13px] text-app-textPrimary focus:border-app-greenMid focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[36px] rounded-lg border border-app-border bg-white px-3 text-[13px] text-app-textPrimary focus:border-app-greenMid focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="OK">OK</option>
              <option value="Low">Low</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

         <div className="overflow-hidden rounded-[10px] border border-app-border bg-app-surface shadow-sm shadow-black/5">
        <div className="border-b border-app-border px-5 py-4">
          <h2 className="text-[14px] font-semibold text-app-textPrimary">Current Inventory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-app-border bg-app-surfaceAlt text-[11px] uppercase tracking-[0.5px] text-app-textSecondary">
                <th className="px-5 py-3 font-semibold text-left">Item</th>
                <th className="px-5 py-3 font-semibold text-right">In Stock</th>
                <th className="px-5 py-3 font-semibold text-right">Threshold</th>
                <th className="px-5 py-3 font-semibold text-left w-[120px]">Level</th>
                <th className="px-5 py-3 font-semibold text-left w-[100px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {stockLoading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-center text-app-textSecondary">Loading stock...</td>
                </tr>
              ) : filteredStock.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-center text-app-textSecondary">No inventory items tracked.</td>
                </tr>
              ) : (
                filteredStock.map((item) => {
                  const status = stockStatus(item.current_stock, item.threshold_qty)
                  const rowBg = status === 'critical' ? 'bg-app-redBg/30' : status === 'low' ? 'bg-app-amberBg/30' : 'hover:bg-[#fafaf9] bg-white'
                  return (
                    <tr key={item.item_id} className={`border-b border-app-border last:border-0 transition-colors ${rowBg}`}>
                      <td className="px-5 py-3.5 font-medium text-app-textPrimary">{item.item_name}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-app-textPrimary">
                        {item.current_stock} <span className="text-app-textSecondary font-normal">{item.unit}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-app-textSecondary">
                        {item.threshold_qty} <span className="font-normal">{item.unit}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <ProgressBar stock={item.current_stock} threshold={item.threshold_qty} />
                      </td>
                      <td className="px-5 py-3.5">
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
          
        </div>
      )}

      
      {/* ACTIVITY TAB */}
      {activeTab === 'Activity' && (
        <div className="space-y-4">
          
          {/* Activity Filter Bar */}
          <div className="flex">
            <select
              value={activityTypeFilter}
              onChange={(e) => setActivityTypeFilter(e.target.value)}
              className="h-[36px] w-[200px] rounded-lg border border-app-border bg-white px-3 text-[13px] text-app-textPrimary focus:border-app-greenMid focus:outline-none"
            >
              <option value="All">All Activity</option>
              <option value="Stock">Incoming Stock</option>
              <option value="Usage">Daily Usage</option>
            </select>
          </div>
        {/* Recent Entries */}
      <div className="overflow-hidden rounded-[10px] border border-app-border bg-app-surface">
        <div className="border-b border-app-border px-4 py-[14px]">
          <h2 className="text-[13px] font-semibold text-app-textPrimary">Recent Activity</h2>
        </div>
        <div className="flex flex-col">
          {feedLoading ? (
            <div className="px-4 py-4 text-center text-[12px] text-app-textSecondary">Loading activity...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="px-4 py-4 text-center text-[12px] text-app-textSecondary">No recent entries.</div>
          ) : (
            filteredEntries.map((entry) => (
              <ActivityRow key={`${entry.type}-${entry.id}`} entry={entry} />
            ))
          )}
        </div>
      </div>
      </div>
      )}
   
      {/* REPORTS TAB */}
      {activeTab === 'Reports' && (
        <div className="space-y-4 pb-10">
          
          <div className="grid gap-4 md:grid-cols-2">
            
            {/* Stock Movement Summary */}
            <div className="flex flex-col rounded-[8px] border border-app-border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="border-b border-app-border px-5 py-4">
                <h2 className="flex items-center gap-2 text-[15px] font-bold text-app-textPrimary">
                  <ArrowRightLeft size={18} className="text-app-greenMid" />
                  Stock Movement (this month)
                </h2>
              </div>
              
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="w-[85px] text-[13px] text-app-textSecondary">Total added</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#f0f0f0]">
                      <div className="h-full bg-app-greenMid w-[90%] rounded-full"></div>
                    </div>
                    <span className="w-[60px] text-right text-[14px] font-bold text-app-greenMid">350 <span className="text-[12px] font-medium text-app-textPrimary">kg/L</span></span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="w-[85px] text-[13px] text-app-textSecondary">Consumed</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#f0f0f0]">
                      <div className="h-full bg-[#cc8500] w-[53%] rounded-full"></div>
                    </div>
                    <span className="w-[60px] text-right text-[14px] font-bold text-[#cc8500]">185 <span className="text-[12px] font-medium text-app-textPrimary">kg/L</span></span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-app-border">
                  <p className="text-[13px] text-app-textSecondary">
                    Utilisation rate: <strong className="text-app-textPrimary">53%</strong> of received stock consumed this month
                  </p>
                </div>
              </div>
            </div>

            {/* Inventory Health Stats */}
            <div className="flex flex-col rounded-[8px] border border-app-border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="border-b border-app-border px-5 py-4">
                <h2 className="flex items-center gap-2 text-[15px] font-bold text-app-textPrimary">
                  <Activity size={18} className="text-app-greenMid" />
                  Inventory Health
                </h2>
              </div>
              
              <div className="p-5 flex flex-1 items-center justify-center gap-12">
                <div className="flex flex-col items-center">
                  <div className="text-[42px] font-bold tracking-tight text-app-greenMid leading-none">{stock.length - low.length - critical.length}</div>
                  <div className="text-[11px] font-bold text-app-textSecondary mt-2 uppercase tracking-[0.05em]">Healthy</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-[42px] font-bold tracking-tight text-[#cc8500] leading-none">{low.length}</div>
                  <div className="text-[11px] font-bold text-app-textSecondary mt-2 uppercase tracking-[0.05em]">Low</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-[42px] font-bold tracking-tight text-[#d32f2f] leading-none">{critical.length}</div>
                  <div className="text-[11px] font-bold text-app-textSecondary mt-2 uppercase tracking-[0.05em]">Critical</div>
                </div>
              </div>
            </div>

          </div>

          {/* Per-item consumption (7-day) */}
          <div className="rounded-[8px] border border-app-border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="border-b border-app-border px-5 py-4">
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-app-textPrimary">
                <BarChart2 size={18} className="text-app-greenMid" />
                Per-item consumption (7-day)
              </h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {stock.map((item) => {
                  // Fake 7-day consumption logic for UI display
                  let val = 0
                  const name = item.item_name.toLowerCase()
                  if (name.includes('rice')) val = 21
                  else if (name.includes('dal') || name.includes('lentil')) val = 8
                  else if (name.includes('oil')) val = 4
                  else if (name.includes('salt')) val = 1
                  else if (name.includes('turmeric')) val = 0.5
                  else val = Math.max(1, Math.round(item.threshold_qty * 0.4))
                  
                  const widthPct = Math.min(100, (val / 25) * 100)

                  return (
                    <div key={item.item_id} className="flex items-center gap-4">
                      <span className="w-[140px] text-[13px] font-medium text-app-textSecondary truncate">{item.item_name}</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#f0f0f0]">
                        <div className="h-full bg-app-greenMid rounded-full" style={{ width: `${widthPct}%` }}></div>
                      </div>
                      <span className="w-[60px] text-right text-[13px] text-app-textPrimary">
                        {val} {item.unit}
                      </span>
                    </div>
                  )
                }).sort((a, b) => {
                   const valA = parseFloat(a.props.children[2].props.children[0])
                   const valB = parseFloat(b.props.children[2].props.children[0])
                   return valB - valA
                })}
              </div>
            </div>
          </div>
          
        </div>
      )}


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

