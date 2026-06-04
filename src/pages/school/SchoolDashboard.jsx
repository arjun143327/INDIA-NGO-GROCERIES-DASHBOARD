import StatCard from '../../components/ui/StatCard'

export default function SchoolDashboard() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[16px] font-semibold text-app-textPrimary">School Dashboard</h1>
        <p className="mt-1 text-[12px] text-app-textSecondary">
          Phase 1 is ready. Stock entry, usage logging, and recent history will be added in Phase 2.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Items" value="--" colour="text-app-greenMid" />
        <StatCard label="Low Stock" value="--" colour="text-app-amber" />
        <StatCard label="Critical" value="--" colour="text-app-red" />
      </div>

      <div className="rounded-lg border border-app-border bg-app-surface p-4 text-[12px] text-app-textSecondary">
        School workflows will plug into this shell next. The layout already follows the design spec spacing,
        colors, and card structure so we can layer in live data without reworking the page.
      </div>
    </div>
  )
}
