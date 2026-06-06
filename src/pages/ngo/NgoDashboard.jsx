import { useState } from "react"
import LiveDot from '../../components/ui/LiveDot'

const TABS = ['Overview', 'Stock Status', 'Usage Trends', 'Manage Items']

export default function NgoDashboard() {
  // useState creates a state variable 'activeTab' and a function to update it 'setActiveTab'.
  // It starts with the default value 'Overview'.
  const [activeTab, setactiveTab] = useState('Overview')

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
            onClick={() => setactiveTab(tab)}
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
        <div className="p-8 text-center text-app-textSecondary bg-white border border-app-border rounded-lg">
          Overview Tab Coming Soon!
        </div>
      )}

      {activeTab === 'Stock Status' && (
        <div className="p-8 text-center text-app-textSecondary bg-white border border-app-border rounded-lg">
          Stock Status Tab Coming Soon!
        </div>
      )}

      {activeTab === 'Usage Trends' && (
        <div className="p-8 text-center text-app-textSecondary bg-white border border-app-border rounded-lg">
          Usage Trends Tab Coming Soon!
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


