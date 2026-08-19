export function formatYen(value: number): string {
  const sign = value < 0 ? '−' : ''
  const abs = Math.abs(value)

  if (abs >= 100_000_000) {
    const oku = abs / 100_000_000
    const digits = oku >= 10 ? 1 : 2
    return `${sign}${trimDecimal(oku, digits)}億円`
  }

  if (abs >= 10_000) {
    const man = abs / 10_000
    const digits = man >= 100 ? 0 : 1
    return `${sign}${trimDecimal(man, digits)}万円`
  }

  return `${sign}${Math.round(abs).toLocaleString('ja-JP')}円`
}

export function formatYenExact(value: number): string {
  const rounded = Math.round(value)
  const sign = rounded < 0 ? '−' : ''
  return `${sign}${Math.abs(rounded).toLocaleString('ja-JP')}円`
}

export function formatPct(value: number, digits = 1): string {
  return `${trimDecimal(value, digits)}%`
}

export function formatMultiple(value: number, digits = 1): string {
  return `${trimDecimal(value, digits)}倍`
}

export function formatMonths(value: number, digits = 1): string {
  return `${trimDecimal(value, digits)}ヶ月`
}

export function formatInput(value: number | '', unit: string): string {
  if (value === '' || !Number.isFinite(value)) return `—${unit}`
  return `${value.toLocaleString('ja-JP')}${unit}`
}

export function trimDecimal(value: number, digits: number): string {
  const fixed = value.toFixed(digits)
  const trimmed = digits === 0 ? fixed : fixed.replace(/\.?0+$/, '')
  const [whole, fraction] = trimmed.split('.')
  const wholeFormatted = Number(whole).toLocaleString('ja-JP')
  return fraction ? `${wholeFormatted}.${fraction}` : wholeFormatted
}
