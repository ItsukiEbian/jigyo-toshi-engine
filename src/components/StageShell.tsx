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
      className={`relative transition-opacity duration-300 ${blocked ? 'opacity-55' : 'opacity-100'}`}
    >
      <article
        className={`rounded-[28px] border-2 p-4 transition-colors duration-300 sm:p-6 ${verdictTheme[verdict].card} ${
          isCurrent ? 'ring-2 ring-offset-2 ring-offset-[#efe8db] ring-slate-900/10' : ''
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
              <p className="text-[11px] font-bold tracking-[0.16em] text-slate-400">ステージ</p>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {title}
              </h2>
            </div>
          </div>
          <VerdictBadge verdict={verdict} />
        </header>

        {blocked ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            前のステージがKILLのため、実運用ではこの段階には進みません。数値の試し入力はできます。
          </p>
        ) : null}

        {children}

        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-3">
          <p className="text-[11px] font-bold tracking-[0.14em] text-slate-400">
            このステージで投入する推奨予算
          </p>
          <p className="mt-1 text-lg font-bold text-slate-800">{budget}</p>
          {passUnlocked && nextName && !blocked ? (
            <p className="mt-2 text-sm font-medium text-emerald-700">
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
      <div className="mx-auto h-6 w-px bg-slate-300" />
      <div className="grid grid-cols-2 gap-3">
        <div
          className={`rounded-2xl border px-3 py-2.5 text-center text-sm font-bold transition-colors ${
            passOn
              ? 'border-emerald-500 bg-emerald-600 text-white'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          PASS → 次へ
        </div>
        <div
          className={`rounded-2xl border px-3 py-2.5 text-center text-sm font-bold transition-colors ${
            killOn
              ? 'border-rose-500 bg-rose-600 text-white'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          KILL → 撤退
        </div>
      </div>
      {!isLast ? (
        <div className="flex flex-col items-center pt-3">
          <div
            className={`h-8 w-px ${
              passOn ? 'bg-emerald-500' : killOn ? 'bg-rose-300' : 'bg-slate-300'
            }`}
          />
          <div
            className={`h-0 w-0 border-x-8 border-x-transparent border-t-8 ${
              passOn
                ? 'border-t-emerald-500'
                : killOn
                  ? 'border-t-rose-300'
                  : 'border-t-slate-300'
            }`}
          />
        </div>
      ) : (
        <div className="mx-auto mt-3 h-1.5 w-16 rounded-full bg-slate-200" />
      )}
    </div>
  )
}
