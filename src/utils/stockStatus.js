const CRITICAL_RATIO = 0.5
const PROGRESS_MULTIPLIER = 1.8

export const STATUS_LABELS = {
  ok: 'OK',
  low: 'Low',
  critical: 'Critical',
}

export const STATUS_STYLES = {
  ok: {
    pill: 'bg-app-greenPale text-app-greenDark',
    bar: 'bg-app-greenMid',
    icon: 'text-app-greenMid',
    strip: 'bg-app-greenPale/40',
  },
  low: {
    pill: 'bg-app-amberBg text-app-amber',
    bar: 'bg-app-amber',
    icon: 'text-app-amber',
    strip: 'bg-app-amberBg/30',
  },
  critical: {
    pill: 'bg-app-redBg text-app-red',
    bar: 'bg-app-red',
    icon: 'text-app-red',
    strip: 'bg-app-redBg/35',
  },
}

export function stockStatus(stock, threshold) {
  if (threshold <= 0) {
    return 'ok'
  }

  const ratio = Number(stock) / Number(threshold)

  if (ratio < CRITICAL_RATIO) {
    return 'critical'
  }

  if (ratio < 1) {
    return 'low'
  }

  return 'ok'
}

export function stockBarPct(stock, threshold) {
  if (threshold <= 0) {
    return 100
  }

  return Math.min(100, Math.round((Number(stock) / (Number(threshold) * PROGRESS_MULTIPLIER)) * 100))
}
