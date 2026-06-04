import { STATUS_STYLES } from '../../utils/stockStatus'
import { formatQty } from '../../utils/formatters'

export default function AlertStrip({ item, onNotify }) {
  const isCritical = item.status === 'critical'

  return (
    <div
      className={`flex items-start gap-3 border-b border-app-border px-4 py-3 last:border-b-0 ${STATUS_STYLES[item.status].strip}`}
    >
      <span aria-hidden="true" className={`mt-0.5 text-sm ${STATUS_STYLES[item.status].icon}`}>
        {isCritical ? '!' : '^'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-app-textPrimary">{item.item_name}</div>
        <div className="text-[11px] text-app-textSecondary">
          {formatQty(item.current_stock)} {item.unit} remaining · Threshold {formatQty(item.threshold_qty)} {item.unit}
        </div>
      </div>
      {isCritical && onNotify ? (
        <button
          type="button"
          onClick={() => onNotify(item)}
          className="h-[26px] rounded-lg border border-app-border bg-app-surface px-2 text-[11px] font-semibold text-app-textPrimary hover:bg-gray-50"
        >
          Notify
        </button>
      ) : null}
    </div>
  )
}
