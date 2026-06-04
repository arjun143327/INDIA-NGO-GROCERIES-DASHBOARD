import { formatQty, relativeDate } from '../../utils/formatters'

export default function ActivityRow({ entry }) {
  const isStock = entry.type === 'stock'

  return (
    <div className="flex items-center gap-4 border-b border-app-border px-5 py-4 last:border-b-0 hover:bg-gray-50/50 transition-colors">
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-app-surfaceAlt border border-app-border">
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 rounded-full ${isStock ? 'bg-app-greenMid' : 'bg-app-amber'}`}
        />
      </div>
      
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold text-app-textPrimary">{entry.item_name}</span>
          <span className="text-[11px] font-medium text-app-textSecondary tracking-wide uppercase">
            {isStock ? 'Incoming Stock' : 'Daily Usage'}
          </span>
        </div>
        <div className="mt-0.5 text-[12px] text-app-textSecondary">{relativeDate(entry.created_at)}</div>
      </div>
      
      <div className={`text-[14px] font-bold ${isStock ? 'text-app-greenMid' : 'text-app-amber'}`}>
        {isStock ? '+' : '-'}
        {formatQty(entry.qty)} <span className="text-[12px] font-medium opacity-80">{entry.unit}</span>
      </div>
    </div>
  )
}
