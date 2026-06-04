import { formatQty, relativeDate } from '../../utils/formatters'

export default function ActivityRow({ entry }) {
  const isStock = entry.type === 'stock'

  return (
    <div className="flex items-center gap-3 border-b border-app-border px-4 py-3 last:border-b-0">
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 rounded-full ${isStock ? 'bg-app-greenMid' : 'bg-app-amber'}`}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium text-app-textPrimary">{entry.item_name}</div>
      </div>
      <div className={`text-[12px] font-semibold ${isStock ? 'text-app-greenMid' : 'text-app-amber'}`}>
        {isStock ? '+' : '-'}
        {formatQty(entry.qty)} {entry.unit}
      </div>
      <div className="text-[11px] text-app-textSecondary">{relativeDate(entry.created_at)}</div>
    </div>
  )
}
