import { useState } from 'react'
import { Competition } from './components/Competition'
import { Diagnosis } from './components/Diagnosis'
import { Stages } from './components/Stages'
import { SummaryPanel } from './components/SummaryPanel'
import { evaluateEngine } from './lib/calc'
import { compareCompetition, defaultCompetitors } from './lib/competition'
import {
  applyPatch,
  cloneInputs,
  diagnose,
  type RecommendedAction,
} from './lib/diagnosis'
import { BUSINESS_TYPES, clonePreset } from './lib/presets'
import type { BusinessType, SimulatorCriteria, SimulatorInputs } from './types'

export default function App() {
  const [businessType, setBusinessType] = useState<BusinessType>('saas')
  const [state, setState] = useState(() => clonePreset('saas'))
  const [simBackup, setSimBackup] = useState<SimulatorInputs | null>(null)
  const [simName, setSimName] = useState<string | null>(null)
  const [competitors, setCompetitors] = useState(() => defaultCompetitors('saas'))

  const inputs: SimulatorInputs = {
    stage1: state.stage1,
    stage2: state.stage2,
    stage3: state.stage3,
    stage4: state.stage4,
  }

  const result = evaluateEngine(inputs, state.criteria)
  const liveDiagnosis = diagnose(inputs, state.criteria, result.overall)
  const actionBase = simBackup ?? inputs
  const diagnosis = {
    ...liveDiagnosis,
    actions: diagnose(
      actionBase,
      state.criteria,
      evaluateEngine(actionBase, state.criteria).overall,
    ).actions,
  }
  const competition = compareCompetition(
    liveDiagnosis.levers,
    inputs,
    state.criteria,
    competitors,
    result.market.value,
  )

  function clearSimulation() {
    setSimBackup(null)
    setSimName(null)
  }

  function applyType(type: BusinessType) {
    setBusinessType(type)
    setState(clonePreset(type))
    setCompetitors(defaultCompetitors(type))
    clearSimulation()
  }

  function reset() {
    setState(clonePreset(businessType))
    setCompetitors(defaultCompetitors(businessType))
    clearSimulation()
  }

  function setInputs(next: SimulatorInputs) {
    setState((prev) => ({ ...prev, ...next }))
  }

  function setCriteria(criteria: SimulatorCriteria) {
    setState((prev) => ({ ...prev, criteria }))
  }

  function applySimulation(action: RecommendedAction) {
    const current = cloneInputs(inputs)
    const base = simBackup ?? current
    if (simBackup === null) setSimBackup(current)
    setSimName(action.name)
    setInputs(applyPatch(base, action.patch))
  }

  function resetSimulation() {
    if (simBackup === null) return
    setInputs(simBackup)
    clearSimulation()
  }

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/35 text-zinc-100 backdrop-blur-2xl">
        <div className="metal-line" />
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.22em] text-sky-300/80">
              新規事業の投資判断アルゴリズム
            </p>
            <h1 className="metal-title mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              新規事業投資エンジン
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              4つの関門を上から順に通過できるか。数字を動かすと、計算結果とPASS / KILLが即座に変わります。
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="mb-1.5 text-[11px] font-bold tracking-[0.16em] text-zinc-500">
                事業タイプ切替
              </p>
              <div className="flex rounded-2xl border border-white/10 bg-black/30 p-1">
                {BUSINESS_TYPES.map((type) => {
                  const active = type.id === businessType
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => applyType(type.id)}
                      className={`min-w-[4.8rem] rounded-xl px-3 py-2 text-sm font-bold transition ${
                        active
                          ? 'badge-ok'
                          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                      }`}
                    >
                      {type.label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-1.5 text-xs text-zinc-500">
                {BUSINESS_TYPES.find((type) => type.id === businessType)?.description}
                に合わせて基準値を入れ替えます
              </p>
            </div>

            <button
              type="button"
              onClick={reset}
              className="h-11 rounded-xl border border-white/12 bg-white/5 px-4 text-sm font-bold text-zinc-100 transition hover:bg-white/10"
            >
              リセット
            </button>
          </div>
        </div>
      </header>

      {simName ? (
        <div className="border-b border-sky-300/20 bg-sky-400/10 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm font-medium text-sky-100">
              シミュレーション中：{simName}
            </p>
            <button
              type="button"
              onClick={resetSimulation}
              className="self-start text-sm font-bold text-sky-200 underline-offset-2 hover:underline"
            >
              シミュレーションをリセット
            </button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8 lg:py-8">
        <div className="mb-5 lg:hidden">
          <SummaryPanel result={result} compact />
        </div>

        <main className="mx-auto w-full max-w-3xl">
          <p className="mb-4 text-center text-xs font-medium text-zinc-500">
            上から①市場 → ②支払意思 → ③ユニット経済 → ④成長効率。枠の色が判定です。
          </p>
          <Stages
            inputs={inputs}
            criteria={state.criteria}
            result={result}
            onInputs={setInputs}
            onCriteria={setCriteria}
          />
        </main>

        <aside className="mt-6 hidden lg:sticky lg:top-6 lg:mt-0 lg:block">
          <SummaryPanel result={result} />
        </aside>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <Diagnosis
          diagnosis={diagnosis}
          simulationName={simName}
          onSimulate={applySimulation}
          onResetSimulation={resetSimulation}
        />
        <div className="mt-6">
          <Competition
            competitors={competitors}
            view={competition}
            ownPotentialYen={result.market.value}
            onChange={setCompetitors}
          />
        </div>
      </div>
    </div>
  )
}
