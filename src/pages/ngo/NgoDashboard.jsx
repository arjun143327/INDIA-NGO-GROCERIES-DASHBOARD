import LiveDot from '../../components/ui/LiveDot'
import StatCard from '../../components/ui/StatCard'

export default function NgoDashboard() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[16px] font-semibold text-app-textPrimary">NGO Dashboard</h1>
          <p className="mt-1 text-[12px] text-app-textSecondary">
            Phase 1 is ready. Alerts, activity, and trend monitoring will be added in the next phases.
          </p>
        </div>
        <LiveDot />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Items Tracked" value="--" />
        <StatCard label="Low Stock" value="--" colour="text-app-amber" />
        <StatCard label="Critical" value="--" colour="text-app-red" />
        <StatCard label="7-Day Usage (kg/L)" value="--" colour="text-app-greenMid" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-lg border border-app-border bg-app-surface p-4 text-[12px] text-app-textSecondary">
          Alert cards and the all-items table will land here in Phase 3.
        </div>
        <div className="rounded-lg border border-app-border bg-app-surface p-4 text-[12px] text-app-textSecondary">
          Weekly trends and recent activity will connect here after the school-side entry flows are in place.
        </div>
      </div>
    </div>
  )
}
