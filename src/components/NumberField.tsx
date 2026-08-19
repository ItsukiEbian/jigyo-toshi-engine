import { formatYen } from '../lib/format'
import type { Numeric } from '../types'

type NumberFieldProps = {
  label: string
  value: Numeric
  onChange: (value: Numeric) => void
  unit: string
  step?: number
  min?: number
  hint?: string
  fieldId?: string
}

export function NumberField({
  label,
  value,
  onChange,
  unit,
  step = 1,
  min,
  hint,
  fieldId,
}: NumberFieldProps) {
  const preview =
    typeof value === 'number' && unit === '円' && Math.abs(value) >= 10_000
      ? formatYen(value)
      : typeof value === 'number' && (unit === '人' || unit.startsWith('人')) && Math.abs(value) >= 1_000
        ? `${value.toLocaleString('ja-JP')}人`
        : null

  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium leading-snug text-slate-600">
        {label}
      </span>
      <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/15">
        <input
          type="number"
          inputMode="decimal"
          data-field={fieldId}
          className="tabular min-w-0 flex-1 bg-transparent px-3 py-2.5 text-right text-lg font-semibold text-slate-900 outline-none [appearance:textfield]"
          value={value}
          min={min}
          step={step}
          onChange={(event) => {
            const raw = event.target.value
            if (raw === '') {
              onChange('')
              return
            }
            const next = Number(raw)
            onChange(Number.isFinite(next) ? next : '')
          }}
        />
        <span className="flex shrink-0 items-center bg-slate-50 px-2.5 text-xs font-medium text-slate-500 sm:px-3 sm:text-sm">
          {unit}
        </span>
      </div>
      {preview || hint ? (
        <span className="mt-1 block text-xs text-slate-400">
          {preview}
          {preview && hint ? ' ／ ' : ''}
          {hint}
        </span>
      ) : null}
    </label>
  )
}
