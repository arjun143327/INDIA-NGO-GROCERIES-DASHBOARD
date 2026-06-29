import { useState, useCallback } from 'react'
import { Search, Filter, AlertCircle, TrendingDown, TrendingUp, Package, ClipboardList, ArrowRightLeft, Activity, BarChart2, Download, Pencil, Check, X } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import AlertStrip from '../../components/ui/AlertStrip'
import ProgressBar from '../../components/ui/ProgressBar'
import StatusPill from '../../components/ui/StatusPill'
import ActivityRow from '../../components/ui/ActivityRow'
import { useCurrentStock } from '../../hooks/useCurrentStock'
import { useAlerts } from '../../hooks/useAlerts'
import { useActivityFeed } from '../../hooks/useActivityFeed'

import { stockStatus } from '../../utils/stockStatus'
import StockEntryForm from '../../components/forms/StockEntryForm'
import UsageEntryForm from '../../components/forms/UsageEntryForm'
import { downloadExcel } from '../../utils/exportExcel'
import CategoryChips from '../../components/ui/CategoryChips'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function SchoolDashboard() {
  const { profile } = useAuth()
  const [activeModal, setActiveModal] = useState(null)
  const [activeTab, setActiveTab] = useState('Overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [activityTypeFilter, setActivityTypeFilter] = useState('All')
  const [reportRange, setReportRange] = useState('7days')
  
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingPrice, setEditingPrice] = useState('')
  const [updatingPrice, setUpdatingPrice] = useState(false)
  
  // Data hooks
  const { stock, loading: stockLoading, refetch: refetchStock } = useCurrentStock()
  const { entries, loading: feedLoading, refetch: refetchFeed } = useActivityFeed(100)
  const { critical, low, hasAlerts } = useAlerts(stock)

  const handleUpdate = useCallback(() => {
    refetchStock()
    refetchFeed()
  }, [refetchStock, refetchFeed])

  const handleModalSuccess = () => {
    setActiveModal(null)
    handleUpdate()
  }
  // Filter logic for the inventory tab
  const filteredStock = stock.filter(item => {
    const searchVal = searchQuery ? searchQuery.toLowerCase() : ''
    const matchesSearch = (item.item_name || '').toLowerCase().includes(searchVal)
    
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

  const handleSavePrice = async (itemId) => {
    if (editingPrice === '' || isNaN(editingPrice) || Number(editingPrice) < 0) return
    
    setUpdatingPrice(true)
    const newPrice = Number(editingPrice)
    const oldItem = stock.find(i => i.item_id === itemId)
    const oldPrice = oldItem?.estimated_cost || 0

    if (newPrice !== oldPrice) {
      try {
        const { error: updateError } = await supabase.from('inventory_items').update({ estimated_cost: newPrice }).eq('id', itemId)
        if (updateError) throw updateError
        
        const { error: insertError } = await supabase.from('price_updates').insert({
          school_id: profile?.school_id,
          item_id: itemId,
          old_price: oldPrice,
          new_price: newPrice,
          updated_by: profile?.id
        })
        if (insertError) throw insertError
        
        handleUpdate()
      } catch (err) {
        console.error('Failed to update price:', err)
        alert('Failed to update price: ' + (err.message || 'Unknown error'))
        setUpdatingPrice(false)
        return // Don't close the edit box so user knows it failed
      }
    }
    
    setEditingItemId(null)
    setUpdatingPrice(false)
  }
  
  // Filter logic for activity tab
  const filteredEntries = entries.filter((entry) => {
    if (entry.type === 'price_update') return false // Hide price updates from school staff
    if (activityTypeFilter === 'All') return true
    if (activityTypeFilter === 'Stock') return entry.type === 'stock'
    if (activityTypeFilter === 'Usage') return entry.type === 'usage'
    return true
  })
  // --- EXPORT HANDLERS ---
  const handleExportInventory = (dataToExport, title, filename) => {
    const formattedData = dataToExport.map(item => ({
      'Item Name': item.item_name,
      'Current Stock': `${item.current_stock} ${item.unit}`,
      'Threshold': `${item.threshold_qty} ${item.unit}`,
      'Status': stockStatus(item.current_stock, item.threshold_qty).toUpperCase()
    }))
    
    downloadExcel(formattedData, 'Inventory', filename, {
      title: `School Groceries Dashboard - ${title}`,
      subtitle: `Exported on: ${new Date().toLocaleString()}`
    })
  }

  const handleExportActivity = (dataToExport, title, filename) => {
    const formattedData = dataToExport.map(entry => {
      const date = new Date(entry.date || entry.created_at)
      const isUsage = entry.type === 'usage'
      return {
        'Activity Type': isUsage ? 'Daily Usage' : 'Incoming Stock',
        'Item Name': entry.item_name,
        'Quantity': `${entry.qty} ${entry.unit}`,
        'Date': date.toLocaleDateString('en-IN'),
        'Time': date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...(isUsage ? { 'Meal Type': entry.meal_type || 'N/A' } : {}),
        'Notes': entry.notes || ''
      }
    })

    downloadExcel(formattedData, 'Activity Log', filename, {
      title: `School Groceries Dashboard - ${title}`,
      subtitle: `Exported on: ${new Date().toLocaleString()}`
    })
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
      {/* Tab navigation */}
          <div className = "flex border-b border-app-border">
            {['Overview', 'Inventory', 'Activity'].map((tab) =>(
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
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-app-border bg-app-surfaceAlt text-[11px] uppercase tracking-[0.5px] text-app-textSecondary">
                      <th className="px-4 py-3 font-semibold text-left">Item</th>
                      <th className="px-4 py-3 font-semibold text-right">In Stock</th>
                      <th className="px-4 py-3 font-semibold text-right">Threshold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockLoading ? (
                      <tr><td colSpan="3" className="p-4 text-center text-app-textSecondary">Loading...</td></tr>
                    ) : stock.map((item) => (
                      <tr key={item.item_id} className="border-b border-app-border last:border-0 hover:bg-[#fafaf9] transition-colors">
                        <td className="px-4 py-3 font-medium text-app-textPrimary">{item.item_name}</td>
                        <td className="px-4 py-3 text-right text-app-textSecondary">{item.current_stock} {item.unit}</td>
                        <td className="px-4 py-3 text-right text-app-textSecondary">{item.threshold_qty} {item.unit}</td>
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
                ) : entries.filter(e => e.type !== 'price_update').slice(0, 4).map((entry, idx) => (
                  <ActivityRow key={`${entry.type}-${entry.id}-${idx}`} entry={entry} />
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
          
          <CategoryChips selectedCategory={categoryFilter} onSelectCategory={setCategoryFilter} />

         <div className="overflow-hidden rounded-[10px] border border-app-border bg-app-surface shadow-sm shadow-black/5">
        <div className="border-b border-app-border px-5 py-4 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-app-textPrimary">Current Inventory</h2>
          <button
            onClick={() => handleExportInventory(filteredStock, 'Current Inventory', 'School_Inventory')}
            className="flex items-center gap-1.5 text-[12px] font-medium text-app-textSecondary hover:text-app-greenMid transition-colors"
          >
            <Download size={14} /> Download Excel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-app-border bg-app-surfaceAlt text-[11px] uppercase tracking-[0.5px] text-app-textSecondary">
                <th className="px-5 py-3 font-semibold text-left">Item Name</th>
                <th className="px-5 py-3 font-semibold text-right">Price (₹)</th>
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
                  <td colSpan="6" className="px-4 py-8 text-center">
                    <p className="text-[13px] font-medium text-app-textPrimary">No items found</p>
                    <p className="mt-1 text-[12px] text-app-textSecondary">
                      {searchQuery || statusFilter !== 'All' 
                        ? `No items match the "${statusFilter}" status filter.` 
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
                      <td className="px-5 py-3.5 font-medium text-app-textPrimary">
                        <div className="flex items-center gap-2">
                          {item.item_name}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {editingItemId === item.item_id ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              autoFocus
                              min="0"
                              disabled={updatingPrice}
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSavePrice(item.item_id)
                                if (e.key === 'Escape') setEditingItemId(null)
                              }}
                              className="w-[70px] h-[28px] rounded border border-app-border px-2 text-[12px] text-right focus:border-app-greenMid focus:outline-none"
                            />
                            <button
                              disabled={updatingPrice}
                              onClick={() => handleSavePrice(item.item_id)}
                              className="p-1 text-app-greenMid hover:bg-app-greenPale rounded disabled:opacity-50"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              disabled={updatingPrice}
                              onClick={() => setEditingItemId(null)}
                              className="p-1 text-app-textSecondary hover:bg-app-surfaceAlt rounded disabled:opacity-50"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2 group cursor-pointer" onClick={() => { setEditingItemId(item.item_id); setEditingPrice(item.estimated_cost || 0) }}>
                            <span className="font-medium text-app-textPrimary">₹{item.estimated_cost || 0}</span>
                            <Pencil size={12} className="text-app-textSecondary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </td>
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
        <div className="border-b border-app-border px-4 py-[14px] flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-app-textPrimary">Recent Activity</h2>
          <button
            onClick={() => handleExportActivity(filteredEntries, 'Activity Log', `School_${activityTypeFilter}_Log`)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-app-textSecondary hover:text-app-greenMid transition-colors"
          >
            <Download size={14} /> Download Excel
          </button>
        </div>
        <div className="flex flex-col max-h-[500px] overflow-y-auto">
          {feedLoading ? (
            <div className="px-4 py-4 text-center text-[12px] text-app-textSecondary">Loading activity...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="px-4 py-4 text-center text-[12px] text-app-textSecondary">No recent entries.</div>
          ) : (
            filteredEntries.map((entry, idx) => (
              <ActivityRow key={`${entry.type}-${entry.id}-${idx}`} entry={entry} />
            ))
          )}
        </div>
      </div>
      </div>
      )}

      {/* Modals */}
      <StockEntryForm 
        open={activeModal === 'stock'} 
        onClose={() => setActiveModal(null)} 
        onSuccess={() => { setActiveModal(null); handleUpdate(); }} 
      />
      <UsageEntryForm 
        open={activeModal === 'usage'} 
        onClose={() => setActiveModal(null)} 
        onSuccess={() => { setActiveModal(null); handleUpdate(); }} 
      />
    </div>
  )
}

