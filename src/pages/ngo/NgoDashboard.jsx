import { useState, useMemo } from "react"
import LiveDot from '../../components/ui/LiveDot'
import StatCard from '../../components/ui/StatCard'
import AlertStrip from '../../components/ui/AlertStrip'
import ActivityRow from '../../components/ui/ActivityRow'
import CategoryChips from '../../components/ui/CategoryChips'
import ProgressBar from '../../components/ui/ProgressBar'
import StatusPill from '../../components/ui/StatusPill'
import { stockStatus, stockBarPct } from '../../utils/stockStatus'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { useCurrentStock } from '../../hooks/useCurrentStock'
import { useAlerts } from '../../hooks/useAlerts'
import { useActivityFeed } from '../../hooks/useActivityFeed'
import { AlertCircle, Calendar, Pencil, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const TABS = ['Overview', 'Master Catalog', 'Usage Trends', 'Expenditure']

export default function NgoDashboard() {
  const [activeTab, setActiveTab] = useState('Overview')
  
  // Dashboard-wide Date Filter
  const [dateRange, setDateRange] = useState('7days')
  
  // Filters for Stock Status Tab
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')

  // Inline Threshold Editing State
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingThreshold, setEditingThreshold] = useState('')
  const [updatingThreshold, setUpdatingThreshold] = useState(false)

  // Pull data from our custom hooks
  const { stock, refetch } = useCurrentStock()
  const { entries } = useActivityFeed(100) // Fetch more to allow meaningful date filtering
  const { critical, low, hasAlerts } = useAlerts(stock)

  // --- DATA AGGREGATION & FILTERING ---

  // 1. Filter all entries by the selected date range
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (dateRange === 'all') return true
      const logDate = new Date(e.created_at)
      const todayDate = new Date()
      const diffTime = Math.abs(todayDate - logDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (dateRange === '7days') return diffDays <= 7
      if (dateRange === '30days') return diffDays <= 30
      return true
    })
  }, [entries, dateRange])

  // 2. Filter Stock for the Stock Status Tab
  const filteredStock = useMemo(() => {
    return stock.filter(item => {
      const searchVal = searchQuery ? searchQuery.toLowerCase() : ''
      const matchesSearch = item.item_name.toLowerCase().includes(searchVal)
      
      const status = stockStatus(item.current_stock, item.threshold_qty)
      let matchesStatus = false
      if (statusFilter === 'All') matchesStatus = true
      else if (statusFilter === 'OK' && status === 'ok') matchesStatus = true
      else if (statusFilter === 'Low' && status === 'low') matchesStatus = true
      else if (statusFilter === 'Critical' && status === 'critical') matchesStatus = true
      
      let matchesCategory = true
      if (categoryFilter !== 'All') {
        matchesCategory = item.category === categoryFilter
      }

      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [stock, searchQuery, statusFilter, categoryFilter])

  // 3. Aggregate Usage Data for Charts
  const chartData = useMemo(() => {
    const usageLogs = filteredEntries.filter(e => e.type === 'usage')

    // Daily consumption trend
    const dailyDataMap = usageLogs.reduce((acc, log) => {
      const date = log.created_at.split('T')[0]
      if (!acc[date]) acc[date] = { date, Total: 0 }
      acc[date].Total += Number(log.qty)
      return acc
    }, {})
    const dailyChart = Object.values(dailyDataMap).sort((a,b) => new Date(a.date) - new Date(b.date))
    
    // Most used items
    const itemUsageMap = usageLogs.reduce((acc, log) => {
      if (!acc[log.item_name]) acc[log.item_name] = { name: log.item_name, Amount: 0 }
      acc[log.item_name].Amount += Number(log.qty)
      return acc
    }, {})
    const itemChart = Object.values(itemUsageMap).sort((a,b) => b.Amount - a.Amount).slice(0, 5)

    return { dailyChart, itemChart }
  }, [filteredEntries])

  // 4. Expenditure Aggregation from stock_entries
  const expenditureData = useMemo(() => {
    const stockEntries = filteredEntries.filter(e => e.type === 'stock')

    // Total spend in period
    const totalSpend = stockEntries.reduce((sum, e) => sum + (Number(e.total_expense) || 0), 0)

    // Spending by item
    const byItemMap = stockEntries.reduce((acc, e) => {
      const name = e.item_name || 'Unknown'
      if (!acc[name]) acc[name] = { name, spend: 0 }
      acc[name].spend += Number(e.total_expense) || 0
      return acc
    }, {})
    const byItem = Object.values(byItemMap).filter(i => i.spend > 0).sort((a, b) => b.spend - a.spend).slice(0, 8)

    // Spending by category
    const byCategoryMap = stockEntries.reduce((acc, e) => {
      const cat = e.category || 'Other'
      if (!acc[cat]) acc[cat] = { name: cat, spend: 0 }
      acc[cat].spend += Number(e.total_expense) || 0
      return acc
    }, {})
    const byCategory = Object.values(byCategoryMap).filter(c => c.spend > 0).sort((a, b) => b.spend - a.spend)

    // Spending by date (monthly)
    const byDateMap = stockEntries.reduce((acc, e) => {
      const date = (e.entry_date || e.created_at || '').split('T')[0]
      if (!acc[date]) acc[date] = { date, spend: 0 }
      acc[date].spend += Number(e.total_expense) || 0
      return acc
    }, {})
    const byDate = Object.values(byDateMap).filter(d => d.spend > 0).sort((a, b) => new Date(a.date) - new Date(b.date))

    return { totalSpend, byItem, byCategory, byDate }
  }, [filteredEntries])

  // 4. Inventory Health for Donut Chart
  const healthChartData = useMemo(() => {
    const healthyCount = stock.length - critical.length - low.length
    return [
      { name: 'Healthy (OK)', value: healthyCount, fill: '#1a6b3c' },
      { name: 'Low Stock', value: low.length, fill: '#d97706' },
      { name: 'Critical', value: critical.length, fill: '#dc2626' }
    ].filter(d => d.value > 0)
  }, [stock, critical, low])

  // --- HANDLERS ---
  async function handleSaveThreshold(itemId) {
    const val = Number(editingThreshold)
    if (isNaN(val) || val < 0) return

    setUpdatingThreshold(true)
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({ threshold_qty: val })
        .eq('id', itemId)
      
      if (error) throw error
      setEditingItemId(null)
      setUpdatingThreshold(false)
      refetch()
    } catch (err) {
      console.error('Failed to update threshold:', err)
      setUpdatingThreshold(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-app-textPrimary">NGO Monitoring Dashboard</h1>
          <p className="mt-1 text-[13px] text-app-textSecondary">
            Monitor single-school inventory, analyze consumption trends, and identify refill needs.
          </p>
        </div>
        
        {/* Global Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-app-border bg-white px-3 h-[36px]">
            <Calendar size={14} className="text-app-textSecondary" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-[13px] text-app-textPrimary focus:outline-none bg-transparent cursor-pointer"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <LiveDot />
        </div>
      </div>

      {/* Tab Navigation Menu */}
      <div className="flex gap-2 border-b border-app-border pb-px">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[13px] font-medium transition-colors ${
              activeTab === tab
              ? 'border-b-2 border-app-greenMid text-app-greenMid'
              : 'border-b-2 border-transparent text-app-textSecondary hover:text-app-textPrimary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'Overview' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* KPI Stat Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Tracked Items" value={stock.length} />
            <StatCard label="Entries in Period" value={filteredEntries.length} />
            <StatCard label="Low Stock Items" value={low.length} colour="text-app-amber" />
            <StatCard label="Critical Items" value={critical.length} colour="text-app-red" />
            {expenditureData.totalSpend > 0 && (
              <StatCard label="Total Spend (Period)" value={`₹${expenditureData.totalSpend.toLocaleString('en-IN')}`} colour="text-app-greenMid" />
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Alerts Section */}
            <div className="rounded-[10px] border border-app-border bg-app-surface shadow-sm shadow-black/5 flex flex-col overflow-hidden h-[340px]">
              <div className="border-b border-app-border px-5 py-4 flex items-center gap-2 bg-app-surfaceAlt/50">
                <AlertCircle size={16} className="text-app-amber" />
                <h2 className="text-[14px] font-semibold text-app-textPrimary">Refill Action Required</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {!hasAlerts ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-70">
                    <div className="h-10 w-10 rounded-full bg-app-greenPale flex items-center justify-center">
                      <div className="h-4 w-4 rounded-full bg-app-greenMid"></div>
                    </div>
                    <p className="text-[13px] text-app-textSecondary">All inventory items are at healthy levels.</p>
                  </div>
                ) : (
                  <>
                    {critical.map(item => (
                      <AlertStrip key={item.item_id} item={item} />
                    ))}
                    {low.map(item => (
                      <AlertStrip key={item.item_id} item={item} />
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="rounded-[10px] border border-app-border bg-app-surface shadow-sm shadow-black/5 flex flex-col overflow-hidden h-[340px]">
              <div className="border-b border-app-border px-5 py-4 bg-app-surfaceAlt/50">
                <h2 className="text-[14px] font-semibold text-app-textPrimary">Recent Activity Log</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredEntries.filter(e => e.type !== 'price_update').length === 0 ? (
                  <p className="p-4 text-center text-[13px] text-app-textSecondary mt-8 opacity-70">No activity recorded in this period.</p>
                ) : (
                  filteredEntries.filter(e => e.type !== 'price_update').slice(0, 10).map((entry, idx) => (
                    <ActivityRow key={`${entry.type}-${entry.id}-${idx}`} entry={entry} />
                  ))
                )}
              </div>
            </div>

            {/* Price Updates Section */}
            <div className="rounded-[10px] border border-app-border bg-app-surface shadow-sm shadow-black/5 flex flex-col overflow-hidden h-[340px]">
              <div className="border-b border-app-border px-5 py-4 flex items-center gap-2 bg-app-surfaceAlt/50">
                <AlertCircle size={16} className="text-blue-500" />
                <h2 className="text-[14px] font-semibold text-app-textPrimary">Price Audits</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {entries.filter(e => e.type === 'price_update').length === 0 ? (
                  <p className="p-4 text-center text-[13px] text-app-textSecondary mt-8 opacity-70">No price updates recorded.</p>
                ) : (
                  entries.filter(e => e.type === 'price_update').slice(0, 10).map((entry, idx) => (
                    <ActivityRow key={`${entry.type}-${entry.id}-${idx}`} entry={entry} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MASTER CATALOG TAB --- */}
      {activeTab === 'Master Catalog' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search items by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[36px] flex-1 rounded-lg border border-app-border bg-white px-3 text-[13px] text-app-textPrimary focus:border-app-greenMid focus:outline-none shadow-sm shadow-black/5"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[36px] w-full sm:w-[180px] rounded-lg border border-app-border bg-white px-3 text-[13px] text-app-textPrimary focus:border-app-greenMid focus:outline-none shadow-sm shadow-black/5 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="OK">Healthy (OK)</option>
              <option value="Low">Low Stock</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          
          <CategoryChips selectedCategory={categoryFilter} onSelectCategory={setCategoryFilter} />

          <div className="overflow-hidden rounded-[10px] border border-app-border bg-app-surface shadow-sm shadow-black/5">
            <div className="border-b border-app-border px-5 py-4 bg-app-surfaceAlt/50">
              <h2 className="text-[14px] font-semibold text-app-textPrimary">Bilingual Master Catalog & Inventory</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-app-border bg-app-surfaceAlt text-[11px] uppercase tracking-[0.5px] text-app-textSecondary">
                    <th className="px-5 py-3 font-semibold text-left">Item Details</th>
                    <th className="px-5 py-3 font-semibold text-left">Procurement</th>
                    <th className="px-5 py-3 font-semibold text-right">In Stock</th>
                    <th className="px-5 py-3 font-semibold text-right">Threshold</th>
                    <th className="px-5 py-3 font-semibold text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-12 text-center">
                        <p className="text-[13px] font-medium text-app-textPrimary">No items found</p>
                        <p className="mt-1 text-[12px] text-app-textSecondary">
                          {searchQuery || statusFilter !== 'All' 
                            ? `No items match your active filters.` 
                            : 'No inventory items are being tracked.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredStock.map((item) => {
                      const status = stockStatus(item.current_stock, item.threshold_qty)
                      const rowBg = status === 'critical' ? 'bg-app-redBg/30' : status === 'low' ? 'bg-app-amberBg/30' : 'hover:bg-[#fafaf9] bg-white'
                      
                      return (
                        <tr key={item.item_id} className={`border-b border-app-border last:border-0 transition-colors ${rowBg}`}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                <span className="font-semibold text-app-textPrimary">{item.name_en} <span className="text-app-textSecondary font-medium">({item.name_ta})</span></span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {item.category && <span className="text-[10px] text-app-textSecondary bg-gray-100 px-1.5 py-0.5 rounded">{item.category}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col">
                              <span className="font-medium text-app-textPrimary">₹{item.estimated_cost}</span>
                              <span className="text-[11px] text-app-textSecondary">{item.purchase_cycle || 'Monthly'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-app-textPrimary">
                            {item.current_stock} <span className="text-app-textSecondary font-normal">{item.unit}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {editingItemId === item.item_id ? (
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  autoFocus
                                  min="0"
                                  disabled={updatingThreshold}
                                  value={editingThreshold}
                                  onChange={(e) => setEditingThreshold(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveThreshold(item.item_id)
                                    if (e.key === 'Escape') setEditingItemId(null)
                                  }}
                                  className="w-[60px] h-[28px] rounded border border-app-border px-2 text-[12px] text-right focus:border-app-greenMid focus:outline-none"
                                />
                                <button
                                  disabled={updatingThreshold}
                                  onClick={() => handleSaveThreshold(item.item_id)}
                                  className="p-1 text-app-greenMid hover:bg-app-greenPale rounded disabled:opacity-50"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  disabled={updatingThreshold}
                                  onClick={() => setEditingItemId(null)}
                                  className="p-1 text-app-textSecondary hover:bg-app-surfaceAlt rounded disabled:opacity-50"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2 group cursor-pointer" onClick={() => { setEditingItemId(item.item_id); setEditingThreshold(item.threshold_qty) }}>
                                <span className="text-app-textSecondary">{item.threshold_qty} <span className="font-normal">{item.unit}</span></span>
                                <Pencil size={12} className="text-app-textSecondary opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            )}
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

      {/* --- USAGE TRENDS TAB --- */}
      {activeTab === 'Usage Trends' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="grid gap-4 lg:grid-cols-2">
            
            {/* Line Chart Card */}
            <div className="rounded-[10px] border border-app-border bg-app-surface shadow-sm shadow-black/5 p-5 flex flex-col">
              <div className="mb-6">
                <h2 className="text-[14px] font-semibold text-app-textPrimary">Daily Consumption Trend</h2>
                <p className="text-[12px] text-app-textSecondary mt-1">Total quantity (kg/L) of all grocery items consumed per day.</p>
              </div>
              <div className="h-[250px] w-full mt-auto">
                {chartData.dailyChart.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[13px] text-app-textSecondary opacity-70">No usage data for this period.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.dailyChart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} tickMargin={10} />
                      <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} tickMargin={10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ color: '#1a6b3c', fontWeight: 600 }}
                      />
                      <Line type="monotone" dataKey="Total" name="Total Consumed" stroke="#1a6b3c" strokeWidth={3} dot={{r: 4, fill: '#1a6b3c', strokeWidth: 0}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Bar Chart Card */}
            <div className="rounded-[10px] border border-app-border bg-app-surface shadow-sm shadow-black/5 p-5 flex flex-col">
              <div className="mb-6">
                <h2 className="text-[14px] font-semibold text-app-textPrimary">Top Used Items</h2>
                <p className="text-[12px] text-app-textSecondary mt-1">The grocery items with the highest consumption by volume.</p>
              </div>
              <div className="h-[250px] w-full mt-auto">
                {chartData.itemChart.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[13px] text-app-textSecondary opacity-70">No usage data for this period.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.itemChart} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                      <XAxis type="number" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} tickMargin={10} />
                      <YAxis dataKey="name" type="category" tick={{fontSize: 11, fill: '#6b7280', fontWeight: 500}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        cursor={{ fill: '#f9fafb' }}
                      />
                      <Bar dataKey="Amount" name="Quantity Used" fill="#059669" radius={[0, 4, 4, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            
            {/* Inventory Health Donut Chart */}
            <div className="rounded-[10px] border border-app-border bg-app-surface shadow-sm shadow-black/5 p-5 flex flex-col lg:col-span-2">
              <div className="mb-4">
                <h2 className="text-[14px] font-semibold text-app-textPrimary">Current Inventory Health</h2>
                <p className="text-[12px] text-app-textSecondary mt-1">Proportion of items currently resting at safe vs critical thresholds.</p>
              </div>
              <div className="h-[250px] w-full mt-auto">
                {healthChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[13px] text-app-textSecondary opacity-70">No inventory items tracked.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={healthChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {healthChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.15)' }}
                        itemStyle={{ fontWeight: 600 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EXPENDITURE TAB --- */}
      {activeTab === 'Expenditure' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-app-textPrimary">Expenditure Summary</h2>
              <p className="text-[12px] text-app-textSecondary mt-0.5">Track spending by item, category, and date from incoming stock entries.</p>
            </div>
            {expenditureData.totalSpend > 0 && (
              <div className="rounded-lg bg-app-greenLight border border-app-greenMid/20 px-4 py-2 text-right">
                <div className="text-[10px] text-app-greenMid uppercase tracking-wide font-semibold">Total Spend</div>
                <div className="text-[20px] font-bold text-app-greenDark">₹{expenditureData.totalSpend.toLocaleString('en-IN')}</div>
              </div>
            )}
          </div>

          {expenditureData.totalSpend === 0 ? (
            <div className="rounded-[10px] border border-app-border bg-app-surface p-12 text-center">
              <p className="text-[14px] font-medium text-app-textPrimary">No expenditure recorded yet</p>
              <p className="text-[12px] text-app-textSecondary mt-1">Add expense amounts when recording incoming stock to track spending here.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {expenditureData.byItem.length > 0 && (
                <div className="overflow-hidden rounded-[10px] border border-app-border bg-app-surface shadow-sm">
                  <div className="border-b border-app-border px-5 py-4 bg-app-surfaceAlt/50">
                    <h3 className="text-[13px] font-semibold text-app-textPrimary">Spending by Item</h3>
                  </div>
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={expenditureData.byItem} layout="vertical" margin={{ left: 80, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                        <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Spend']} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="spend" fill="#1a6b3c" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {expenditureData.byCategory.length > 0 && (
                <div className="overflow-hidden rounded-[10px] border border-app-border bg-app-surface shadow-sm">
                  <div className="border-b border-app-border px-5 py-4 bg-app-surfaceAlt/50">
                    <h3 className="text-[13px] font-semibold text-app-textPrimary">Spending by Category</h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {expenditureData.byCategory.map((cat) => {
                      const pct = Math.round((cat.spend / expenditureData.totalSpend) * 100)
                      return (
                        <div key={cat.name}>
                          <div className="flex justify-between text-[12px] mb-1">
                            <span className="font-medium text-app-textPrimary">{cat.name}</span>
                            <span className="text-app-textSecondary">₹{cat.spend.toLocaleString('en-IN')} <span className="text-[10px]">({pct}%)</span></span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full bg-app-greenMid" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {expenditureData.byDate.length > 1 && (
                <div className="overflow-hidden rounded-[10px] border border-app-border bg-app-surface shadow-sm lg:col-span-2">
                  <div className="border-b border-app-border px-5 py-4 bg-app-surfaceAlt/50">
                    <h3 className="text-[13px] font-semibold text-app-textPrimary">Spending Over Time</h3>
                  </div>
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={expenditureData.byDate}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                        <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Spend']} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Line type="monotone" dataKey="spend" stroke="#1a6b3c" strokeWidth={2} dot={{ r: 4, fill: '#1a6b3c' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
