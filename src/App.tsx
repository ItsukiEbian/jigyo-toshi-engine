import { useState } from 'react'
import { Diagnosis } from './components/Diagnosis'
import { Stages } from './components/Stages'
import { SummaryPanel } from './components/SummaryPanel'
import { evaluateEngine } from './lib/calc'
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

  function clearSimulation() {
    setSimBackup(null)
    setSimName(null)
  }

  function applyType(type: BusinessType) {
    setBusinessType(type)
    setState(clonePreset(type))
    clearSimulation()
  }

  function reset() {
    setState(clonePreset(businessType))
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
      <header className="border-b border-slate-900/5 bg-[#122033] text-[#f6f1e6]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.22em] text-blue-300/90">
              新規事業の投資判断アルゴリズム
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              新規事業投資エンジン
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
              4つの関門を上から順に通過できるか。数字を動かすと、計算結果とPASS / KILLが即座に変わります。
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="mb-1.5 text-[11px] font-bold tracking-[0.16em] text-white/50">
                事業タイプ切替
              </p>
              <div className="flex rounded-2xl bg-white/10 p-1">
                {BUSINESS_TYPES.map((type) => {
                  const active = type.id === businessType
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => applyType(type.id)}
                      className={`min-w-[4.8rem] rounded-xl px-3 py-2 text-sm font-bold transition ${
                        active
                          ? 'bg-white text-slate-900'
                          : 'text-white/75 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {type.label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-1.5 text-xs text-white/50">
                {BUSINESS_TYPES.find((type) => type.id === businessType)?.description}
                に合わせて基準値を入れ替えます
              </p>
            </div>

            <button
              type="button"
              onClick={reset}
              className="h-11 rounded-xl border border-white/20 px-4 text-sm font-bold text-white transition hover:bg-white/10"
            >
              リセット
            </button>
          </div>
        </div>
      </header>

      {simName ? (
        <div className="border-b border-blue-200 bg-blue-50">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm font-medium text-blue-950">
              シミュレーション中：{simName}
            </p>
            <button
              type="button"
              onClick={resetSimulation}
              className="self-start text-sm font-bold text-blue-900 underline-offset-2 hover:underline"
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
          <p className="mb-4 text-center text-xs font-medium text-slate-500">
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
      </div>
    </div>
  )
}
