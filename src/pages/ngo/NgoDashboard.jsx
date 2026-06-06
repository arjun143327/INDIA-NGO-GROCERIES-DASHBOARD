import { useState } from "react"
import LiveDot from '../../components/ui/LiveDot'
import StatCard from '../../components/ui/StatCard'
import AlertStrip from '../../components/ui/AlertStrip'
import ActivityRow from '../../components/ui/ActivityRow'
import { useCurrentStock } from '../../hooks/useCurrentStock'
import { useAlerts } from '../../hooks/useAlerts'
import { useActivityFeed } from '../../hooks/useActivityFeed'
import { AlertCircle } from 'lucide-react'
import ProgressBar from '../../components/ui/ProgressBar'
import StatusPill from '../../components/ui/StatusPill'
import { stockStatus, stockBarPct } from '../../utils/stockStatus'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts'

const TABS = ['Overview', 'Stock Status', 'Usage Trends', 'Manage Items']

export default function NgoDashboard() {
  // useState creates a state variable 'activeTab' and a function to update it 'setActiveTab'.
  // It starts with the default value 'Overview'.
  const [activeTab, setActiveTab] = useState('Overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  //pull data from our custom hooks
  const { stock } = useCurrentStock()
  const { entries } = useActivityFeed()
  const { critical, low, hasAlerts } = useAlerts(stock)

  const today = new Date().toISOString().split('T')[0]
  const todayEntriesCount = entries.filter(e => e.created_at.startsWith(today)).length

  const filteredStock = stock.filter(item => {
    const searchVal = searchQuery ? searchQuery.toLowerCase() : ''
    const matchesSearch = item.item_name.toLowerCase().includes(searchVal)
    
    const status = stockStatus(item.current_stock, item.threshold_qty)
    let matchesStatus = false
    if (statusFilter === 'All') matchesStatus = true
    else if (statusFilter === 'OK' && status === 'ok') matchesStatus = true
    else if (statusFilter === 'Low' && status === 'low') matchesStatus = true
    else if (statusFilter === 'Critical' && status === 'critical') matchesStatus = true
    return matchesSearch && matchesStatus
  })
  

  // DATA AGGREGATION FOR CHARTS 

  //STEP 1: only look at usage logs (ignore incoming stocks)
  const usageLogs = entries.filter(e => e.type === 'usage')

  //STEP 2: group by date for the line chart
  const dailyDataMap = usageLogs.reduce((acc, log) => {
    const date = log.created_at.split('T')[0]
    if (!acc[date]) acc[date] = { date, Total: 0}
    acc[date].Total += Number(log.qty)
    return acc
  }, {})

  //convert our grouped object back into an array sorted by date
  const dailyChartData = Object.values(dailyDataMap).sort((a,b) => new Date(a.date) - new Date(b.date))
  
  //STEP 3: group by t=item for the bar chart
  const itemUsageMap = usageLogs.reduce((acc, log) => {
    if (!acc[log.item_name]) acc[log.item_name] = { name: log.item_name, Amount: 0}
    acc[log.item_name].Amount += Number(log.qty)
    return acc
  }, {})

  // Sort descending by amount, and slice the top 5
  const itemChartData = Object.values(itemUsageMap).sort((a,b) => b.Amount - a.Amount).slice(0, 5)

  return (
    <div className = "space-y-4">
      {/* Header Section */}
      <div className = "flex items-start justify-between gap-4">
        <div>
          <h1 className = "text-[16px] font-semibold text-app-textPrimary">NGO Dashboard</h1>
          <p className="mt-1 text-[12px] text-app-textSecondary">
            Monitor inventory, analyze trends and manage master grocery items.
          </p>
        </div>
        <LiveDot />
      </div>

      {/* Tab Navigation Menu */}
      <div className = "flex gap-2 border-b border-app-border pb-px">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[13px] font-medium transition-colors ${
              activeTab === tab? 'border-b-2 border-app-greenMid text-app-greenMid'
              : 'border-b-2 border-transparent text-app-textSecondary hover:text-app-textPrimary'

            }`}
            >
              {tab}
            </button>
        ))}
      </div>

      {/* Tab contents using conditional rendering */}

      {activeTab === 'Overview' && (
        <div className="space-y-4">
          {/* KPI stat Card */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard label="Items Tracked" value={stock.length} />
            <StatCard label="Today's Entries" value={todayEntriesCount} />
            <StatCard label="Low Stock" value={low.length} colour="text-app-amber" />
            <StatCard label="Critical" value={critical.length} colour="text-app-red" />
          </div>

        <div className="grid gap-4 lg:grid-cols-[1fr,1fr]">
          {/* Alerts Section */}
          <div className="rounded-[10px] border border-app-border bg-app-surface shadow-sm
          shadow-black/5 flex flex-col overflow-hidden h-[300px]">
            <div className="border-b border-app-border px-5 py-4 flex items-center gap-2">
              <AlertCircle size={16} className="text-app-amber" />
              <h2 className="text-[14px] font-semibold text-app-textPrimary">Needs Attention</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {!hasAlerts ? (
                <p className ="text-[13px] text-app-textSecondary text-center mt-8">All items are at healthy levels.</p>
              ) : (
                <>
                 {critical.map(item => (
                     <AlertStrip key={item.item_id} status="critical" title={item.item_name}
                     description={`${item.current_stock} ${item.unit} remaining · Threshold: ${item.threshold_qty} ${item.unit}`} />
                  ))}
                  {low.map(item => (
                     <AlertStrip key={item.item_id} status="low" title={item.item_name}
                     description={`${item.current_stock} ${item.unit} remaining · Threshold: ${item.threshold_qty} ${item.unit}`} />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Recent activity section */}
          <div className="rounded-[10px] border border-app-border bg-app-surface shadow-sm shadow-black/5 flex flex-col overflow-hidden h-[300px]">
              <div className="border-b border-app-border px-5 py-4">
                <h2 className="text-[14px] font-semibold text-app-textPrimary">Recent Activity</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {entries.length === 0 ? (
                  <p className="p-4 text-center text-[13px] text-app-textSecondary mt-4">No recent activity.</p>
                ) : (
                  entries.slice(0, 10).map((entry, idx) => (
                    <ActivityRow key={`${entry.type}-${entry.id}-${idx}`} entry={entry} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

            {activeTab === 'Stock Status' && (
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

          {/* Table Container */}
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
                  {filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center">
                        <p className="text-[13px] font-medium text-app-textPrimary">No items found</p>
                        <p className="mt-1 text-[12px] text-app-textSecondary">
                          {searchQuery || statusFilter !== 'All' 
                            ? `No items match your filters.` 
                            : 'No inventory items tracked yet.'}
                        </p>
                      </td>
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
                            <ProgressBar percentage={stockBarPct(item.current_stock, item.threshold_qty)} status={status} />
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


            {activeTab === 'Usage Trends' && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            
            {/* Line Chart Card: Daily Consumption */}
            <div className="rounded-[10px] border border-app-border bg-app-surface shadow-sm shadow-black/5 p-5">
              <h2 className="text-[14px] font-semibold text-app-textPrimary mb-4">Daily Consumption Trend</h2>
              <div className="h-[250px] w-full">
                {dailyChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[13px] text-app-textSecondary">No usage data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{fontSize: 11, fill: '#555555'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 11, fill: '#555555'}} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="Total" stroke="#1a6b3c" strokeWidth={3} dot={{r: 4, fill: '#1a6b3c'}} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Bar Chart Card: Most Used Items */}
            <div className="rounded-[10px] border border-app-border bg-app-surface shadow-sm shadow-black/5 p-5">
              <h2 className="text-[14px] font-semibold text-app-textPrimary mb-4">Most Used Items (All Time)</h2>
              <div className="h-[250px] w-full">
                {itemChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[13px] text-app-textSecondary">No usage data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={itemChartData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                      <XAxis type="number" tick={{fontSize: 11, fill: '#555555'}} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" tick={{fontSize: 11, fill: '#555555'}} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="Amount" fill="#d97706" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>
        </div>
      )}


      {activeTab === 'Manage Items' && (
        <div className="p-8 text-center text-app-textSecondary bg-white border border-app-border rounded-lg">
          Manage Items Tab Coming Soon!
        </div>
      )}
    </div>
  )
}


