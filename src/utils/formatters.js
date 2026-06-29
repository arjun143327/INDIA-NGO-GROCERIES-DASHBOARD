export function relativeDate(isoString) {
  if (!isoString) return ''
  
  // If it's a date-only string like "YYYY-MM-DD", parse it as local midnight
  const isDateOnly = isoString.length === 10 && !isoString.includes('T')
  const date = isDateOnly ? new Date(isoString + 'T00:00:00') : new Date(isoString)
  
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    if (isDateOnly) return 'Today'
    return `Today ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatQty(value) {
  const numberValue = Number.parseFloat(value)

  if (Number.isNaN(numberValue)) {
    return '0'
  }

  return Number.isInteger(numberValue) ? String(numberValue) : numberValue.toFixed(1)
}
