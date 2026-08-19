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
    card: 'glass border-[rgba(142,182,234,0.38)] shadow-[0_0_0_1px_rgba(120,170,230,0.08),0_20px_50px_rgba(0,0,0,0.45)]',
    badge: 'badge-ok',
    formula: 'glass-soft border-[rgba(142,182,234,0.22)] bg-[rgba(80,130,200,0.08)]',
    spine: 'badge-ok',
    glow: 'bg-sky-300/70',
  },
  kill: {
    card: 'glass border-[rgba(214,90,90,0.45)] shadow-[0_0_0_1px_rgba(200,70,70,0.1),0_20px_50px_rgba(0,0,0,0.45)]',
    badge: 'badge-err',
    formula: 'glass-soft border-[rgba(214,90,90,0.25)] bg-[rgba(180,50,50,0.1)]',
    spine: 'badge-err',
    glow: 'bg-red-400/70',
  },
  review: {
    card: 'glass border-[rgba(196,100,100,0.38)] shadow-[0_0_0_1px_rgba(180,80,80,0.08),0_20px_50px_rgba(0,0,0,0.45)]',
    badge: 'badge-soft',
    formula: 'glass-soft border-[rgba(196,100,100,0.2)] bg-[rgba(160,60,60,0.08)]',
    spine: 'badge-soft',
    glow: 'bg-red-300/60',
  },
  invalid: {
    card: 'glass',
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
