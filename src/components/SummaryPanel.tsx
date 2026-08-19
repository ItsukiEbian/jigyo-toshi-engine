import type { EngineResult } from '../lib/calc'
import { overallDetail, overallLabel, verdictLabel } from '../lib/calc'
import { formatMultiple, formatMonths, formatPct, formatYen } from '../lib/format'
import { STAGE_META } from '../lib/presets'
import type { OverallStatus, Verdict } from '../types'

const statusTone: Record<OverallStatus, string> = {
  all_pass: 'border-blue-400 bg-blue-600 text-white',
  partial_kill: 'border-red-400 bg-red-600 text-white',
  review: 'border-red-300 bg-red-500 text-white',
  in_progress: 'border-slate-300 bg-slate-800 text-white',
}

const rowTone: Record<Verdict, string> = {
  pass: 'bg-blue-50 text-blue-800',
  kill: 'bg-red-50 text-red-800',
  review: 'bg-red-50 text-red-800',
  invalid: 'bg-slate-100 text-slate-600',
}

type SummaryPanelProps = {
  result: EngineResult
  compact?: boolean
}

export function SummaryPanel({ result, compact = false }: SummaryPanelProps) {
  const current = STAGE_META[result.currentStageIndex]
  const reachedLabel =
    result.overall === 'all_pass'
      ? '全4ステージを通過'
      : `${current.numeral} ${current.title} まで`

  const metrics = [
    result.market.value === null ? '計算不可' : formatYen(result.market.value),
    result.paid.value === null ? '計算不可' : formatPct(result.paid.value, 2),
    result.unit.efficiency === null
      ? '計算不可'
      : `${formatMultiple(result.unit.efficiency)}${
          result.unit.paybackMonths === null
            ? ''
            : ` / ${formatMonths(result.unit.paybackMonths)}`
        }`,
    result.growth.value === null ? '計算不可' : formatMultiple(result.growth.value),
  ]

  if (compact) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-slate-400">現在地</p>
            <p className="text-sm font-bold text-slate-900">{reachedLabel}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone[result.overall]}`}
          >
            {overallLabel(result.overall)}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1">
          {result.stages.map((stage, index) => (
            <div
              key={stage.id}
              className={`rounded-lg px-1 py-1.5 text-center text-[11px] font-bold ${rowTone[stage.verdict]}`}
            >
              {STAGE_META[index].numeral}
              <span className="mt-0.5 block font-medium">{verdictLabel(stage.verdict)}</span>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#fffdf8] shadow-[0_24px_50px_-32px_rgba(15,23,42,0.45)]">
      <div className={`px-5 py-5 ${statusTone[result.overall]}`}>
        <p className="text-[11px] font-bold tracking-[0.18em] text-white/70">全体の投資判断</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{overallLabel(result.overall)}</p>
        <p className="mt-2 text-sm text-white/85">{overallDetail(result.overall)}</p>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div>
          <p className="text-[11px] font-bold tracking-[0.16em] text-slate-400">現在どのステージまで進んでいるか</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{reachedLabel}</p>
          {result.overall !== 'all_pass' ? (
            <p className="mt-1 text-sm text-slate-500">判定の焦点は {current.title}</p>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold tracking-[0.16em] text-slate-400">
            各ステージの判定
          </p>
          <ul className="space-y-2">
            {result.stages.map((stage, index) => {
              const meta = STAGE_META[index]
              const isCurrent = result.currentStageIndex === index
              return (
                <li
                  key={stage.id}
                  className={`rounded-2xl border px-3 py-3 ${
                    isCurrent ? 'border-slate-900/20 bg-white' : 'border-transparent bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800">
                      {meta.numeral} {meta.short}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${rowTone[stage.verdict]}`}
                    >
                      {verdictLabel(stage.verdict)}
                    </span>
                  </div>
                  <p className="tabular mt-1 text-xs text-slate-500">{metrics[index]}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
