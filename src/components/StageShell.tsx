import type { ReactNode } from 'react'
import type { Verdict } from '../types'
import { VerdictBadge, verdictTheme } from './uiBits'

type StageShellProps = {
  numeral: string
  title: string
  budget: string
  verdict: Verdict
  blocked: boolean
  passUnlocked: boolean
  nextName: string | null
  isCurrent: boolean
  children: ReactNode
}

export function StageShell({
  numeral,
  title,
  budget,
  verdict,
  blocked,
  passUnlocked,
  nextName,
  isCurrent,
  children,
}: StageShellProps) {
  return (
    <section
      className={`relative transition-opacity duration-300 ${blocked ? 'opacity-50' : 'opacity-100'}`}
    >
      <article
        className={`rounded-[28px] p-4 transition-colors duration-300 sm:p-6 ${verdictTheme[verdict].card} ${
          isCurrent ? 'ring-1 ring-white/20' : ''
        }`}
      >
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white ${verdictTheme[verdict].spine}`}
            >
              {numeral}
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-zinc-500">ステージ</p>
              <h2 className="text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">
                {title}
              </h2>
            </div>
          </div>
          <VerdictBadge verdict={verdict} />
        </header>

        {blocked ? (
          <p className="mb-4 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            前のステージがKILLのため、実運用ではこの段階には進みません。数値の試し入力はできます。
          </p>
        ) : null}

        {children}

        <div className="glass-soft mt-5 rounded-2xl px-4 py-3">
          <p className="text-[11px] font-bold tracking-[0.14em] text-zinc-500">
            このステージで投入する推奨予算
          </p>
          <p className="mt-1 text-lg font-bold text-zinc-100">{budget}</p>
          {passUnlocked && nextName && !blocked ? (
            <p className="mt-2 text-sm font-medium text-sky-300">
              次のステージの予算が解放されます（{nextName}）
            </p>
          ) : null}
        </div>
      </article>
    </section>
  )
}

export function FlowBranch({ verdict, isLast }: { verdict: Verdict; isLast: boolean }) {
  const passOn = verdict === 'pass'
  const killOn = verdict === 'kill'

  return (
    <div className="relative mx-auto max-w-xl py-3">
      <div className="mx-auto h-6 w-px bg-white/15" />
      <div className="grid grid-cols-2 gap-3">
        <div
          className={`rounded-2xl border px-3 py-2.5 text-center text-sm font-bold transition-colors ${
            passOn
              ? 'badge-ok border-transparent'
              : 'border-sky-300/20 bg-sky-400/5 text-sky-200'
          }`}
        >
          PASS → 次へ
        </div>
        <div
          className={`rounded-2xl border px-3 py-2.5 text-center text-sm font-bold transition-colors ${
            killOn
              ? 'badge-err border-transparent'
              : 'border-red-400/20 bg-red-500/5 text-red-200'
          }`}
        >
          KILL → 撤退
        </div>
      </div>
      {!isLast ? (
        <div className="flex flex-col items-center pt-3">
          <div
            className={`h-8 w-px ${
              passOn ? 'bg-sky-400/70' : killOn ? 'bg-red-400/50' : 'bg-white/15'
            }`}
          />
          <div
            className={`h-0 w-0 border-x-8 border-x-transparent border-t-8 ${
              passOn
                ? 'border-t-sky-400/70'
                : killOn
                  ? 'border-t-red-400/50'
                  : 'border-t-white/15'
            }`}
          />
        </div>
      ) : (
        <div className="metal-line mx-auto mt-3 w-16" />
      )}
    </div>
  )
}
