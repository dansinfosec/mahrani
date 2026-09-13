const formatters = new Map()

export function formatPrice(amount, currency = 'USD', { minimumFractionDigits } = {}) {
  const value = Number(amount)
  if (Number.isNaN(value)) return ''
  const key = `${currency}-${minimumFractionDigits ?? 'auto'}`
  if (!formatters.has(key)) {
    formatters.set(
      key,
      new Intl.NumberFormat('en', {
        style: 'currency',
        currency,
        minimumFractionDigits: minimumFractionDigits ?? (Number.isInteger(value) ? 0 : 2),
        maximumFractionDigits: 2,
      }),
    )
  }
  return formatters.get(key).format(value)
}

export function padNumber(n, width = 2) {
  return String(n).padStart(width, '0')
}

export function classNames(...parts) {
  return parts.filter(Boolean).join(' ')
}
