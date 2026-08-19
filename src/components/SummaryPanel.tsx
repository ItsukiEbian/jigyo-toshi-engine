import type { EngineResult } from '../lib/calc'
import { overallDetail, overallLabel, verdictLabel } from '../lib/calc'
import { formatMultiple, formatMonths, formatPct, formatYen } from '../lib/format'
import { STAGE_META } from '../lib/presets'
import type { OverallStatus, Verdict } from '../types'

const statusTone: Record<OverallStatus, string> = {
  all_pass: 'badge-ok',
  partial_kill: 'badge-err',
  review: 'badge-soft',
  in_progress: 'badge-mute',
}

const rowTone: Record<Verdict, string> = {
  pass: 'bg-sky-400/10 text-sky-200',
  kill: 'bg-red-500/12 text-red-200',
  review: 'bg-red-500/10 text-red-200',
  invalid: 'bg-white/5 text-zinc-400',
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
      <section className="glass rounded-2xl p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-zinc-500">現在地</p>
            <p className="text-sm font-bold text-zinc-100">{reachedLabel}</p>
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
    <section className="glass overflow-hidden rounded-[28px]">
      <div className={`px-5 py-5 ${statusTone[result.overall]}`}>
        <p className="text-[11px] font-bold tracking-[0.18em] text-white/70">全体の投資判断</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{overallLabel(result.overall)}</p>
        <p className="mt-2 text-sm text-white/85">{overallDetail(result.overall)}</p>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div>
          <p className="text-[11px] font-bold tracking-[0.16em] text-zinc-500">現在どのステージまで進んでいるか</p>
          <p className="mt-1 text-lg font-bold text-zinc-50">{reachedLabel}</p>
          {result.overall !== 'all_pass' ? (
            <p className="mt-1 text-sm text-zinc-500">判定の焦点は {current.title}</p>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold tracking-[0.16em] text-zinc-500">
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
                    isCurrent ? 'border-white/15 bg-white/10' : 'border-transparent bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-zinc-100">
                      {meta.numeral} {meta.short}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${rowTone[stage.verdict]}`}
                    >
                      {verdictLabel(stage.verdict)}
                    </span>
                  </div>
                  <p className="tabular mt-1 text-xs text-zinc-500">{metrics[index]}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
