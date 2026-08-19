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
    card: 'border-emerald-500 bg-[#f4fbf6] shadow-[0_18px_40px_-28px_rgba(16,185,129,0.9)]',
    badge: 'bg-emerald-600 text-white',
    formula: 'border-emerald-200 bg-emerald-50/90',
    spine: 'bg-emerald-500',
    glow: 'bg-emerald-400',
  },
  kill: {
    card: 'border-rose-500 bg-[#fff6f6] shadow-[0_18px_40px_-28px_rgba(244,63,94,0.8)]',
    badge: 'bg-rose-600 text-white',
    formula: 'border-rose-200 bg-rose-50/90',
    spine: 'bg-rose-500',
    glow: 'bg-rose-400',
  },
  review: {
    card: 'border-amber-400 bg-[#fff9ee] shadow-[0_18px_40px_-28px_rgba(245,158,11,0.75)]',
    badge: 'bg-amber-500 text-white',
    formula: 'border-amber-200 bg-amber-50/90',
    spine: 'bg-amber-400',
    glow: 'bg-amber-300',
  },
  invalid: {
    card: 'border-slate-300 bg-[#fffdf8] shadow-[0_16px_36px_-28px_rgba(15,23,42,0.35)]',
    badge: 'bg-slate-500 text-white',
    formula: 'border-indigo-100 bg-indigo-50/90',
    spine: 'bg-slate-300',
    glow: 'bg-slate-300',
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
    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-base font-semibold text-slate-800 sm:text-xl">
      {tokens.map((token, index) => (
        <span
          key={`${token}-${index}`}
          className={formulaOps.has(token) ? 'text-slate-400' : 'whitespace-nowrap'}
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
      <p className="text-[11px] font-bold tracking-[0.18em] text-slate-500">{name}</p>
      <div className="mt-2">{formula}</div>
      {substitution ? (
        <p className="tabular mt-2 text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
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
      <p className="tabular text-3xl font-bold leading-none tracking-tight text-slate-900 sm:text-4xl">
        {value}
      </p>
      {caption ? <p className="mt-2 text-sm text-slate-500">{caption}</p> : null}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-bold tracking-[0.16em] text-slate-400">{children}</p>
  )
}
