import { NumberField } from './NumberField'
import { SectionLabel } from './uiBits'
import {
  COMPETITOR_POSITIONS,
  competitorStatus,
  formatAxisScore,
  type CompetitionView,
  type Competitor,
} from '../lib/competition'

type CompetitionProps = {
  competitors: Competitor[]
  view: CompetitionView
  ownPotentialYen: number | null
  onChange: (next: Competitor[]) => void
}

export function Competition({
  competitors,
  view,
  ownPotentialYen,
  onChange,
}: CompetitionProps) {
  function update(id: string, patch: Partial<Competitor>) {
    onChange(competitors.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function updateTag(id: string, index: 0 | 1 | 2, value: string) {
    onChange(
      competitors.map((item) => {
        if (item.id !== id) return item
        const tags: [string, string, string] = [...item.tags]
        tags[index] = value
        return { ...item, tags }
      }),
    )
  }

  function addCompetitor() {
    if (competitors.length >= 3) return
    const names = ['競合A', '競合B', '競合C']
    onChange([
      ...competitors,
      {
        id: `comp-${Math.random().toString(36).slice(2, 9)}`,
        name: names[competitors.length] ?? `競合${competitors.length + 1}`,
        position: '新興勢力',
        revenueOku: 2.5,
        unitPrice: 40_000,
        tags: ['', '', ''],
      },
    ])
  }

  function removeCompetitor(id: string) {
    if (competitors.length <= 1) return
    onChange(competitors.filter((item) => item.id !== id))
  }

  return (
    <section className="glass rounded-[28px] p-4 sm:p-6">
      <header className="mb-5">
        <p className="text-[11px] font-bold tracking-[0.18em] text-zinc-500">比較</p>
        <h2 className="metal-title mt-1 text-xl font-bold tracking-tight sm:text-2xl">
          競合分析
        </h2>
        <div className="metal-line mt-3" />
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          仮の数字でもよいので、自社と競合の位置関係を相対比較します。
        </p>
      </header>

      <div className="glass-soft rounded-2xl px-4 py-4 sm:px-5">
        <p className="text-[11px] font-bold tracking-[0.18em] text-zinc-500">総合判断</p>
        <p className="mt-2 text-base font-semibold leading-relaxed text-zinc-100 sm:text-lg">
          {view.comment}
        </p>
      </div>

      <div className="mt-6">
        <SectionLabel>競合候補</SectionLabel>
        <div className="grid gap-3 lg:grid-cols-3">
          {competitors.map((competitor) => (
            <CompetitorCard
              key={competitor.id}
              competitor={competitor}
              status={competitorStatus(competitor, ownPotentialYen)}
              canRemove={competitors.length > 1}
              onChange={(patch) => update(competitor.id, patch)}
              onTag={(index, value) => updateTag(competitor.id, index, value)}
              onRemove={() => removeCompetitor(competitor.id)}
            />
          ))}
        </div>
        {competitors.length < 3 ? (
          <button
            type="button"
            onClick={addCompetitor}
            className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-zinc-100 transition hover:bg-white/10"
          >
            競合を追加
          </button>
        ) : (
          <p className="mt-3 text-center text-xs text-zinc-500">比較は3社までです。</p>
        )}
      </div>

      <div className="mt-7">
        <SectionLabel>自社 vs 競合</SectionLabel>
        <p className="mb-3 text-xs leading-relaxed text-zinc-500">
          自社の勝ち筋スコアを100点満点の基準に、競合を相対表示しています。
        </p>
        <div className="space-y-4">
          {view.axes.map((axis) => (
            <div
              key={axis.id}
              className={`rounded-2xl px-4 py-4 ${
                axis.selfWeak
                  ? 'border border-red-400/55 bg-red-500/10'
                  : 'glass-soft'
              }`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-zinc-100">{axis.label}</p>
                {axis.selfWeak ? (
                  <span className="text-[11px] font-bold tracking-wide text-red-300">
                    自社の弱み
                  </span>
                ) : null}
              </div>
              <ul className="space-y-2.5">
                {axis.series.map((row) => {
                  const width = row.score === null ? 0 : Math.max(row.score, 2)
                  const isSelf = row.id === 'self'
                  return (
                    <li
                      key={row.id}
                      className={`rounded-xl px-3 py-2.5 ${
                        row.highlight === 'self-weak'
                          ? 'border border-red-400/70 bg-red-500/12'
                          : row.highlight === 'rival-strong'
                            ? 'border border-sky-400/70 bg-sky-400/12'
                            : 'border border-white/10 bg-black/20'
                      }`}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-zinc-100">
                          {row.name}
                          {row.highlight === 'rival-strong' ? (
                            <span className="ml-2 text-[10px] font-bold text-sky-300">
                              競合の強み
                            </span>
                          ) : null}
                          {row.highlight === 'self-weak' ? (
                            <span className="ml-2 text-[10px] font-bold text-red-300">
                              基準割れ
                            </span>
                          ) : null}
                        </p>
                        <p className="tabular text-xs font-bold text-zinc-100">
                          {formatAxisScore(row.score)}
                        </p>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${
                            row.highlight === 'self-weak'
                              ? 'bg-red-400'
                              : row.highlight === 'rival-strong'
                                ? 'bg-sky-400'
                                : isSelf
                                  ? 'bg-zinc-200'
                                  : 'bg-zinc-500'
                          }`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CompetitorCard({
  competitor,
  status,
  canRemove,
  onChange,
  onTag,
  onRemove,
}: {
  competitor: Competitor
  status: string
  canRemove: boolean
  onChange: (patch: Partial<Competitor>) => void
  onTag: (index: 0 | 1 | 2, value: string) => void
  onRemove: () => void
}) {
  return (
    <article className="glass-soft flex flex-col rounded-2xl p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <label className="block min-w-0 flex-1">
          <span className="mb-1.5 block text-[13px] font-medium text-zinc-400">競合名</span>
          <input
            value={competitor.name}
            onChange={(event) => onChange({ name: event.target.value })}
            className="input-shell w-full rounded-xl px-3 py-2 text-sm font-semibold text-zinc-50 outline-none"
          />
        </label>
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="mt-6 text-xs font-bold text-zinc-500 hover:text-red-300"
          >
            外す
          </button>
        ) : null}
      </div>

      <label className="mb-3 block">
        <span className="mb-1.5 block text-[13px] font-medium text-zinc-400">ポジション</span>
        <select
          value={
            COMPETITOR_POSITIONS.includes(
              competitor.position as (typeof COMPETITOR_POSITIONS)[number],
            )
              ? competitor.position
              : '新興勢力'
          }
          onChange={(event) => onChange({ position: event.target.value })}
          className="input-shell w-full rounded-xl px-3 py-2 text-sm font-semibold text-zinc-50 outline-none"
        >
          {COMPETITOR_POSITIONS.map((position) => (
            <option key={position} value={position} className="bg-zinc-900">
              {position}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3">
        <NumberField
          label="推定売上規模"
          unit="億円"
          step={0.1}
          value={competitor.revenueOku}
          onChange={(revenueOku) => onChange({ revenueOku })}
        />
        <NumberField
          label="推定顧客単価"
          unit="円"
          value={competitor.unitPrice}
          onChange={(unitPrice) => onChange({ unitPrice })}
        />
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-[13px] font-medium text-zinc-400">強みタグ（最大3つ）</p>
        <div className="grid grid-cols-3 gap-2">
          {competitor.tags.map((tag, index) => (
            <input
              key={`${competitor.id}-tag-${index}`}
              value={tag}
              maxLength={12}
              placeholder="強み"
              onChange={(event) => onTag(index as 0 | 1 | 2, event.target.value)}
              className="input-shell rounded-xl px-2 py-2 text-center text-xs font-medium text-zinc-100 outline-none"
            />
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-zinc-400">
        現在の状況：{status}
      </p>
    </article>
  )
}
