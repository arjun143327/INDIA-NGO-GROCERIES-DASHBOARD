export default function StatCard({ label, value, colour = 'text-app-textPrimary' }) {
  return (
    <div className="rounded-lg border border-app-border bg-app-surface px-4 py-[14px]">
      <div className={`text-[22px] font-semibold leading-none ${colour}`}>{value}</div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.3px] text-app-textSecondary">
        {label}
      </div>
    </div>
  )
}
