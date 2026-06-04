export default function StatCard({ label, value, colour = 'text-app-textPrimary' }) {
  return (
    <div className="flex flex-col justify-center rounded-[10px] border border-app-border bg-app-surface px-5 py-4 shadow-sm shadow-black/5">
      <div className={`text-[28px] font-bold tracking-tight leading-tight ${colour}`}>{value}</div>
      <div className="mt-1 text-[12px] font-medium text-app-textSecondary">
        {label}
      </div>
    </div>
  )
}
