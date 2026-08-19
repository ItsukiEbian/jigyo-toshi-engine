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
    <section className="rounded-[28px] border-2 border-slate-200 bg-[#fffdf8] p-4 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.35)] sm:p-6">
      <header className="mb-5">
        <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400">診断</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          勝ち筋診断 & 次のアクション
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          今の数字から、どこが強くて次に何を動かすべきかを定量で示します。
        </p>
      </header>

      {simulationName ? (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-blue-900">
            シミュレーション中：{simulationName}
            <span className="mt-1 block text-xs font-normal text-blue-800/80">
              フローチャートの入力と判定は、この仮説を当てはめた仮の数字です。
            </span>
          </p>
          <button
            type="button"
            onClick={onResetSimulation}
            className="h-10 shrink-0 rounded-xl border border-blue-300 bg-white px-3 text-sm font-bold text-blue-900 transition hover:bg-blue-100"
          >
            シミュレーションをリセット
          </button>
        </div>
      ) : null}

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/90 px-4 py-4 sm:px-5">
        <p className="text-[11px] font-bold tracking-[0.18em] text-slate-500">総合判断</p>
        <p className="mt-2 text-base font-semibold leading-relaxed text-slate-800 sm:text-lg">
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
          <p className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-500">
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
      <p className="mb-3 text-xs leading-relaxed text-slate-500">
        各変数を前後20%動かしたとき、スコアがどれだけ揺れるか。影響の大きい順です。
      </p>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-500">
          感度を計算できる入力がありません。
        </p>
      ) : (
        <ol className="space-y-3">
          {items.map((item, index) => (
            <li key={item.id} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-bold text-slate-800">
                  {index === 0 ? '最も影響が大きい変数：' : `${index + 1}番目：`}
                  {item.label}
                </p>
                <p className="tabular shrink-0 text-sm font-bold text-slate-700">
                  影響度 {trimDecimal(item.sharePct, 0)}%
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${index === 0 ? 'bg-red-500' : 'bg-slate-400'}`}
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
        <p className="mb-3 text-xs text-slate-500">レバー間の差が小さく、勝ち筋はまだ明確ではありません。</p>
      ) : (
        <p className="mb-3 text-xs text-slate-500">4つのレバーを0〜100点で分解しています。</p>
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
                  ? 'border-blue-500 bg-[#f3f7fd]'
                  : isWeak
                    ? 'border-red-400 bg-[#fff5f5]'
                    : 'border-slate-200 bg-white/80'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-800">{lever.label}</p>
                <div className="flex items-center gap-2">
                  {isWin ? (
                    <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                      ここが勝ち筋
                    </span>
                  ) : null}
                  {isWeak ? (
                    <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                      ここがボトルネック
                    </span>
                  ) : null}
                  <span className="tabular text-sm font-bold text-slate-800">
                    {formatScore(lever.score)}
                  </span>
                </div>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    isWin ? 'bg-blue-500' : isWeak ? 'bg-red-500' : 'bg-slate-400'
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
      className={`flex h-full flex-col rounded-2xl border px-4 py-4 ${
        active ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white/80'
      }`}
    >
      <h3 className="text-sm font-bold leading-snug text-slate-900">{action.name}</h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{action.body}</p>
      <ul className="mt-3 space-y-1">
        {action.impacts.map((impact) => (
          <li key={impact} className="text-xs font-medium text-slate-700">
            {impact}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">必要予算の目安：{action.budget}</p>
      <button
        type="button"
        onClick={onSimulate}
        className={`mt-4 h-10 rounded-xl text-sm font-bold transition ${
          active
            ? 'bg-blue-600 text-white'
            : 'bg-[#122033] text-[#f6f1e6] hover:bg-[#1a3358]'
        }`}
      >
        {active ? '適用中' : 'この条件でシミュレート'}
      </button>
    </article>
  )
}
