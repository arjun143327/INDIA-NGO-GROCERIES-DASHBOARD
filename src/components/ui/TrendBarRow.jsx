import { formatQty } from '../../utils/formatters'

export default function TrendBarRow({ day, value, maxValue }) {
  const width = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0

  return (
    <div className="flex items-center gap-3">
      <div className="w-[30px] text-[11px] text-app-textSecondary">{day}</div>
      <div className="h-2 flex-1 overflow-hidden rounded bg-gray-100">
        <div className="h-full rounded bg-app-greenMid" style={{ width: `${width}%` }} />
      </div>
      <div className="w-14 text-right text-[11px] font-medium text-app-textPrimary">{formatQty(value)}</div>
    </div>
  )
}
