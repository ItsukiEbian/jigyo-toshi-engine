import type { ReactNode } from 'react'
import type { Verdict } from '../types'
import { verdictLabel } from '../lib/calc'

export const verdictTheme: Record<
  Verdict,
  {
    card: string
    badge: string
    formula: string
    spine: string
    glow: string
  }
> = {
  pass: {
    card: 'block-ok',
    badge: 'badge-ok',
    formula: 'border-sky-300/25 bg-black/20',
    spine: 'badge-ok',
    glow: 'bg-sky-300/70',
  },
  kill: {
    card: 'block-err',
    badge: 'badge-err',
    formula: 'border-red-300/25 bg-black/20',
    spine: 'badge-err',
    glow: 'bg-red-400/70',
  },
  review: {
    card: 'block-warn',
    badge: 'badge-soft',
    formula: 'border-red-300/20 bg-black/20',
    spine: 'badge-soft',
    glow: 'bg-red-300/60',
  },
  invalid: {
    card: 'block-mute',
    badge: 'badge-mute',
    formula: 'glass-soft',
    spine: 'badge-mute',
    glow: 'bg-zinc-500',
  },
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold tracking-wide ${verdictTheme[verdict].badge}`}
    >
      {verdictLabel(verdict)}
    </span>
  )
}

const formulaOps = new Set(['＝', '×', '÷', '（', '）'])

export function FormulaLine({ tokens }: { tokens: string[] }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-base font-semibold text-zinc-100 sm:text-xl">
      {tokens.map((token, index) => (
        <span
          key={`${token}-${index}`}
          className={formulaOps.has(token) ? 'text-zinc-500' : 'whitespace-nowrap'}
        >
          {token}
        </span>
      ))}
    </div>
  )
}

export function FormulaBlock({
  name,
  formula,
  substitution,
  children,
  verdict,
}: {
  name: string
  formula: ReactNode
  substitution?: ReactNode
  children: ReactNode
  verdict: Verdict
}) {
  return (
    <div className={`rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 ${verdictTheme[verdict].formula}`}>
      <p className="text-[11px] font-bold tracking-[0.18em] text-zinc-500">{name}</p>
      <div className="mt-2">{formula}</div>
      {substitution ? (
        <p className="tabular mt-2 text-sm font-medium leading-relaxed text-zinc-400 sm:text-base">
          {substitution}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </div>
  )
}

export function MetricValue({
  value,
  caption,
}: {
  value: string
  caption?: string
}) {
  return (
    <div>
      <p className="tabular text-3xl font-bold leading-none tracking-tight text-zinc-50 sm:text-4xl">
        {value}
      </p>
      {caption ? <p className="mt-2 text-sm text-zinc-500">{caption}</p> : null}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-bold tracking-[0.16em] text-zinc-500">{children}</p>
  )
}
