import { formatQty, relativeDate } from '../../utils/formatters'

export default function ActivityRow({ entry }) {
  const isStock = entry.type === 'stock'
  const isUsage = entry.type === 'usage'
  const isPriceUpdate = entry.type === 'price_update'

  let iconColor = 'bg-app-textSecondary'
  let textColor = 'text-app-textPrimary'
  let label = ''
  let valueDisplay = null

  if (isStock) {
    iconColor = 'bg-app-greenMid'
    textColor = 'text-app-greenMid'
    label = 'Incoming Stock'
    valueDisplay = `+${formatQty(entry.qty)} ${entry.unit}`
  } else if (isUsage) {
    iconColor = 'bg-app-amber'
    textColor = 'text-app-amber'
    label = entry.meal_type ? `Daily Usage • ${entry.meal_type}` : 'Daily Usage'
    valueDisplay = `-${formatQty(entry.qty)} ${entry.unit}`
  } else if (isPriceUpdate) {
    iconColor = 'bg-blue-500'
    textColor = 'text-blue-600'
    label = 'Price Update'
    valueDisplay = `₹${entry.old_price || 0} → ₹${entry.new_price}`
  }

  return (
    <div className="flex items-center gap-4 border-b border-app-border px-5 py-4 last:border-b-0 hover:bg-gray-50/50 transition-colors">
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-app-surfaceAlt border border-app-border">
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 rounded-full ${iconColor}`}
        />
      </div>
      
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold text-app-textPrimary">{entry.item_name}</span>
          <span className="text-[11px] font-medium text-app-textSecondary tracking-wide uppercase">
            {label}
          </span>
        </div>
        <div className="mt-0.5 text-[12px] text-app-textSecondary">{relativeDate(entry.created_at)}</div>
      </div>
      
      <div className={`text-[14px] font-bold ${textColor}`}>
        {valueDisplay}
      </div>
    </div>
  )
}
