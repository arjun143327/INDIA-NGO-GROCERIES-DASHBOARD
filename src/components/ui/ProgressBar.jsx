import { STATUS_STYLES, stockBarPct, stockStatus } from '../../utils/stockStatus'

export default function ProgressBar({ stock, threshold }) {
  const status = stockStatus(stock, threshold)
  const width = stockBarPct(stock, threshold)

  return (
    <div className="h-[5px] w-20 overflow-hidden rounded bg-gray-200">
      <div className={`h-full rounded ${STATUS_STYLES[status].bar}`} style={{ width: `${width}%` }} />
    </div>
  )
}
