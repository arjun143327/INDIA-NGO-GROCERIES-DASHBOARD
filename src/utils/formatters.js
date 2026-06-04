export function relativeDate(isoString) {
  const date = new Date(isoString)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return `Today ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function formatQty(value) {
  const numberValue = Number.parseFloat(value)

  if (Number.isNaN(numberValue)) {
    return '0'
  }

  return Number.isInteger(numberValue) ? String(numberValue) : numberValue.toFixed(1)
}
