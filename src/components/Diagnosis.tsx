import { SectionLabel } from './uiBits'
import {
  formatScore,
  type DiagnosisResult,
  type LeverScore,
  type RecommendedAction,
} from '../lib/diagnosis'
import { trimDecimal } from '../lib/format'

type DiagnosisProps = {
  diagnosis: DiagnosisResult
  simulationName: string | null
  onSimulate: (action: RecommendedAction) => void
  onResetSimulation: () => void
}

export function Diagnosis({
  diagnosis,
  simulationName,
  onSimulate,
  onResetSimulation,
}: DiagnosisProps) {
  return (
    <section className="glass rounded-[28px] p-4 sm:p-6">
      <header className="mb-5">
        <p className="text-[11px] font-bold tracking-[0.18em] text-zinc-500">診断</p>
        <h2 className="metal-title mt-1 text-xl font-bold tracking-tight sm:text-2xl">
          勝ち筋診断 & 次のアクション
        </h2>
        <div className="metal-line mt-3" />
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          今の数字から、どこが強くて次に何を動かすべきかを定量で示します。
        </p>
      </header>

      {simulationName ? (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-sky-300/25 bg-sky-400/8 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-sky-100">
            シミュレーション中：{simulationName}
            <span className="mt-1 block text-xs font-normal text-sky-200/70">
              フローチャートの入力と判定は、この仮説を当てはめた仮の数字です。
            </span>
          </p>
          <button
            type="button"
            onClick={onResetSimulation}
            className="h-10 shrink-0 rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-bold text-sky-100 transition hover:bg-white/10"
          >
            シミュレーションをリセット
          </button>
        </div>
      ) : null}

      <div className="glass-soft rounded-2xl px-4 py-4 sm:px-5">
        <p className="text-[11px] font-bold tracking-[0.18em] text-zinc-500">総合判断</p>
        <p className="mt-2 text-base font-semibold leading-relaxed text-zinc-100 sm:text-lg">
          {diagnosis.comment}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SensitivityList items={diagnosis.sensitivities} />
        <LeverPanel
          levers={diagnosis.levers}
          strongestId={diagnosis.tied ? null : diagnosis.strongest?.id ?? null}
          weakestId={diagnosis.tied ? null : diagnosis.weakest?.id ?? null}
          tied={diagnosis.tied}
        />
      </div>

      <div className="mt-6">
        <SectionLabel>推奨アクション（定量付き）</SectionLabel>
        {diagnosis.actions.length === 0 ? (
          <p className="glass-soft rounded-2xl px-4 py-3 text-sm text-zinc-400">
            いまの入力では提案を作れません。数字を入れてから再度確認してください。
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {diagnosis.actions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                active={simulationName === action.name}
                onSimulate={() => onSimulate(action)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function SensitivityList({ items }: { items: DiagnosisResult['sensitivities'] }) {
  return (
    <div>
      <SectionLabel>ボトルネック特定</SectionLabel>
      <p className="mb-3 text-xs leading-relaxed text-zinc-500">
        各変数を前後20%動かしたとき、スコアがどれだけ揺れるか。影響の大きい順です。
      </p>
      {items.length === 0 ? (
        <p className="glass-soft rounded-2xl px-4 py-3 text-sm text-zinc-400">
          感度を計算できる入力がありません。
        </p>
      ) : (
        <ol className="space-y-3">
          {items.map((item, index) => (
            <li key={item.id} className="glass-soft rounded-2xl px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-bold text-zinc-100">
                  {index === 0 ? '最も影響が大きい変数：' : `${index + 1}番目：`}
                  {item.label}
                </p>
                <p className="tabular shrink-0 text-sm font-bold text-zinc-300">
                  影響度 {trimDecimal(item.sharePct, 0)}%
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${index === 0 ? 'bg-red-400' : 'bg-zinc-500'}`}
                  style={{ width: `${Math.max(item.sharePct, 3)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function LeverPanel({
  levers,
  strongestId,
  weakestId,
  tied,
}: {
  levers: LeverScore[]
  strongestId: string | null
  weakestId: string | null
  tied: boolean
}) {
  return (
    <div>
      <SectionLabel>勝ち筋スコア</SectionLabel>
      {tied ? (
        <p className="mb-3 text-xs text-zinc-500">レバー間の差が小さく、勝ち筋はまだ明確ではありません。</p>
      ) : (
        <p className="mb-3 text-xs text-zinc-500">4つのレバーを0〜100点で分解しています。</p>
      )}
      <ul className="space-y-3">
        {levers.map((lever) => {
          const isWin = lever.id === strongestId
          const isWeak = lever.id === weakestId
          const width = lever.score === null ? 0 : Math.max(lever.score, 2)
          return (
            <li
              key={lever.id}
              className={`rounded-2xl border px-4 py-3 ${
                isWin
                  ? 'border-sky-300/30 bg-sky-400/8'
                  : isWeak
                    ? 'border-red-400/30 bg-red-500/8'
                    : 'glass-soft'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-zinc-100">{lever.label}</p>
                <div className="flex items-center gap-2">
                  {isWin ? (
                    <span className="badge-ok rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                      ここが勝ち筋
                    </span>
                  ) : null}
                  {isWeak ? (
                    <span className="badge-err rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                      ここがボトルネック
                    </span>
                  ) : null}
                  <span className="tabular text-sm font-bold text-zinc-100">
                    {formatScore(lever.score)}
                  </span>
                </div>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${
                    isWin ? 'bg-sky-400' : isWeak ? 'bg-red-400' : 'bg-zinc-500'
                  }`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ActionCard({
  action,
  active,
  onSimulate,
}: {
  action: RecommendedAction
  active: boolean
  onSimulate: () => void
}) {
  return (
    <article
      className={`flex h-full flex-col rounded-2xl px-4 py-4 ${
        active ? 'border border-sky-300/30 bg-sky-400/10' : 'glass-soft'
      }`}
    >
      <h3 className="text-sm font-bold leading-snug text-zinc-50">{action.name}</h3>
      <p className="mt-2 text-xs leading-relaxed text-zinc-400">{action.body}</p>
      <ul className="mt-3 space-y-1">
        {action.impacts.map((impact) => (
          <li key={impact} className="text-xs font-medium text-zinc-300">
            {impact}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-zinc-500">必要予算の目安：{action.budget}</p>
      <button
        type="button"
        onClick={onSimulate}
        className={`mt-4 h-10 rounded-xl text-sm font-bold transition ${
          active
            ? 'badge-ok'
            : 'border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10'
        }`}
      >
        {active ? '適用中' : 'この条件でシミュレート'}
      </button>
    </article>
  )
}
