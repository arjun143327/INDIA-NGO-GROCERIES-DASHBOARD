import { STATUS_LABELS, STATUS_STYLES } from '../../utils/stockStatus'

export default function StatusPill({ status }) {
  // Fallback to 'ok' if an invalid status is passed
  const safeStatus = STATUS_STYLES[status] ? status : 'ok'

  return (
    <span
      className={`inline-flex rounded-[10px] px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[safeStatus].pill}`}
    >
      {STATUS_LABELS[safeStatus]}
    </span>
  )
}
