import { STATUS_LABELS, STATUS_STYLES, stockStatus } from '../../utils/stockStatus'

export default function StatusPill({ stock, threshold }) {
  const status = stockStatus(stock, threshold)

  return (
    <span
      className={`inline-flex rounded-[10px] px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[status].pill}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
