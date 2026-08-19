import type {
  OverallStatus,
  SimulatorCriteria,
  SimulatorInputs,
  Stage1Inputs,
  Stage2Inputs,
  Stage3Inputs,
  Stage4Inputs,
} from '../types'
import {
  calcGrowthEfficiency,
  calcMarketPotential,
  calcPaidRate,
  calcUnitEconomics,
  toNumber,
  toOkuYen,
} from './calc'
import { formatMonths, formatMultiple, formatPct, formatYen, trimDecimal } from './format'

export const LEVER_IDS = ['market', 'acquisition', 'unit', 'scale'] as const
export type LeverId = (typeof LEVER_IDS)[number]

export type LeverScore = {
  id: LeverId
  label: string
  score: number | null
}

export type SensitivityItem = {
  id: string
  label: string
  impact: number
  sharePct: number
}

export type InputPatch = {
  stage1?: Partial<Stage1Inputs>
  stage2?: Partial<Stage2Inputs>
  stage3?: Partial<Stage3Inputs>
  stage4?: Partial<Stage4Inputs>
}

export type RecommendedAction = {
  id: string
  name: string
  body: string
  impacts: string[]
  budget: string
  patch: InputPatch
}

export type DiagnosisResult = {
  levers: LeverScore[]
  strongest: LeverScore | null
  weakest: LeverScore | null
  tied: boolean
  sensitivities: SensitivityItem[]
  actions: RecommendedAction[]
  comment: string
}

const LEVER_LABEL: Record<LeverId, string> = {
  market: '市場規模の強さ',
  acquisition: '顧客獲得のしやすさ',
  unit: '利益構造の強さ',
  scale: 'スケールの伸びしろ',
}

export function cloneInputs(inputs: SimulatorInputs): SimulatorInputs {
  return {
    stage1: { ...inputs.stage1 },
    stage2: { ...inputs.stage2 },
    stage3: { ...inputs.stage3 },
    stage4: { ...inputs.stage4 },
  }
}

export function applyPatch(inputs: SimulatorInputs, patch: InputPatch): SimulatorInputs {
  return {
    stage1: { ...inputs.stage1, ...patch.stage1 },
    stage2: { ...inputs.stage2, ...patch.stage2 },
    stage3: { ...inputs.stage3, ...patch.stage3 },
    stage4: { ...inputs.stage4, ...patch.stage4 },
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function scoreHigherBetter(
  value: number | null,
  pass: number | null,
  kill: number | null,
): number | null {
  if (value === null || pass === null || kill === null) return null
  if (!(pass > 0)) return null

  if (value <= 0) return 0

  if (!(pass > kill) || kill <= 0) {
    if (value >= pass) return clamp(70 + ((value - pass) / pass) * 30, 70, 100)
    return clamp((value / pass) * 70, 0, 69)
  }

  if (value < kill) return clamp((value / kill) * 30, 0, 30)

  if (value < pass) {
    const t = (value - kill) / (pass - kill)
    return 30 + t * 40
  }

  return clamp(70 + ((value - pass) / pass) * 30, 70, 100)
}

function scoreLowerBetter(
  value: number | null,
  passMax: number | null,
  killAbove: number | null,
): number | null {
  if (value === null || passMax === null || killAbove === null) return null
  if (!(passMax > 0)) return null

  if (value <= 0) return 100

  if (!(killAbove > passMax)) {
    if (value <= passMax) return clamp(70 + (1 - value / passMax) * 30, 70, 100)
    return clamp(70 * (passMax / value), 0, 69)
  }

  if (value <= passMax) return clamp(70 + (1 - value / passMax) * 30, 70, 100)

  if (value <= killAbove) {
    const t = (value - passMax) / (killAbove - passMax)
    return 70 - t * 40
  }

  return clamp(30 * (1 - (value - killAbove) / killAbove), 0, 30)
}

export function scoreLevers(
  inputs: SimulatorInputs,
  criteria: SimulatorCriteria,
): LeverScore[] {
  const market = calcMarketPotential(inputs.stage1)
  const paid = calcPaidRate(inputs.stage2)
  const unit = calcUnitEconomics(inputs.stage3)
  const growth = calcGrowthEfficiency(inputs.stage4)

  const efficiencyScore = scoreHigherBetter(
    unit.efficiency,
    toNumber(criteria.stage3.passEfficiency),
    toNumber(criteria.stage3.killEfficiency),
  )
  const paybackScore = scoreLowerBetter(
    unit.paybackMonths,
    toNumber(criteria.stage3.passPaybackMonths),
    toNumber(criteria.stage3.killPaybackMonths),
  )
  const unitScore =
    efficiencyScore === null && paybackScore === null
      ? null
      : ((efficiencyScore ?? 0) + (paybackScore ?? 0)) /
        ((efficiencyScore === null ? 0 : 1) + (paybackScore === null ? 0 : 1))

  return [
    {
      id: 'market',
      label: LEVER_LABEL.market,
      score: scoreHigherBetter(
        market,
        toOkuYen(criteria.stage1.passOku),
        toOkuYen(criteria.stage1.killOku),
      ),
    },
    {
      id: 'acquisition',
      label: LEVER_LABEL.acquisition,
      score: scoreHigherBetter(
        paid,
        toNumber(criteria.stage2.passPct),
        toNumber(criteria.stage2.killPct),
      ),
    },
    {
      id: 'unit',
      label: LEVER_LABEL.unit,
      score: unitScore,
    },
    {
      id: 'scale',
      label: LEVER_LABEL.scale,
      score: scoreHigherBetter(
        growth,
        toNumber(criteria.stage4.passMultiple),
        toNumber(criteria.stage4.killMultiple),
      ),
    },
  ]
}

function validScores(levers: LeverScore[]): LeverScore[] {
  return levers.filter((lever) => lever.score !== null)
}

function compositeScore(levers: LeverScore[]): number | null {
  const valid = validScores(levers)
  if (valid.length === 0) return null
  return valid.reduce((sum, lever) => sum + (lever.score ?? 0), 0) / valid.length
}

function pickStrongest(levers: LeverScore[]): LeverScore | null {
  const valid = validScores(levers)
  if (valid.length === 0) return null
  return valid.reduce((best, lever) =>
    (lever.score ?? -1) > (best.score ?? -1) ? lever : best,
  )
}

function pickWeakest(levers: LeverScore[]): LeverScore | null {
  const valid = validScores(levers)
  if (valid.length === 0) return null
  return valid.reduce((worst, lever) =>
    (lever.score ?? 101) < (worst.score ?? 101) ? lever : worst,
  )
}

type VariableSpec = {
  id: string
  label: string
  read: (inputs: SimulatorInputs) => number | null
  write: (inputs: SimulatorInputs, next: number) => SimulatorInputs
}

function setPaidRate(inputs: SimulatorInputs, nextPct: number): SimulatorInputs {
  const contacted = toNumber(inputs.stage2.contactedCustomers)
  if (contacted === null || contacted <= 0) return inputs
  return applyPatch(inputs, {
    stage2: { paidCustomers: (nextPct / 100) * contacted },
  })
}

const SENSITIVITY_VARS: VariableSpec[] = [
  {
    id: 'targetCustomers',
    label: 'ターゲット顧客数',
    read: (inputs) => toNumber(inputs.stage1.targetCustomers),
    write: (inputs, next) => applyPatch(inputs, { stage1: { targetCustomers: next } }),
  },
  {
    id: 'acquisitionRate',
    label: '獲得可能率',
    read: (inputs) => toNumber(inputs.stage1.acquisitionRatePct),
    write: (inputs, next) => applyPatch(inputs, { stage1: { acquisitionRatePct: next } }),
  },
  {
    id: 'annualCustomerValue',
    label: '年間顧客単価',
    read: (inputs) => toNumber(inputs.stage1.annualCustomerValue),
    write: (inputs, next) => applyPatch(inputs, { stage1: { annualCustomerValue: next } }),
  },
  {
    id: 'paidRate',
    label: '有効有料化率',
    read: (inputs) => calcPaidRate(inputs.stage2),
    write: setPaidRate,
  },
  {
    id: 'unitPrice',
    label: '顧客単価',
    read: (inputs) => toNumber(inputs.stage3.unitPrice),
    write: (inputs, next) => applyPatch(inputs, { stage3: { unitPrice: next } }),
  },
  {
    id: 'grossMargin',
    label: '粗利益率',
    read: (inputs) => toNumber(inputs.stage3.grossMarginPct),
    write: (inputs, next) => applyPatch(inputs, { stage3: { grossMarginPct: next } }),
  },
  {
    id: 'retention',
    label: '平均継続期間',
    read: (inputs) => toNumber(inputs.stage3.retentionMonths),
    write: (inputs, next) => applyPatch(inputs, { stage3: { retentionMonths: next } }),
  },
  {
    id: 'cac',
    label: '顧客獲得費用',
    read: (inputs) => toNumber(inputs.stage3.acquisitionCost),
    write: (inputs, next) => applyPatch(inputs, { stage3: { acquisitionCost: next } }),
  },
  {
    id: 'incrementalProfit',
    label: '追加投資で増えた粗利益',
    read: (inputs) => toNumber(inputs.stage4.incrementalGrossProfit),
    write: (inputs, next) =>
      applyPatch(inputs, { stage4: { incrementalGrossProfit: next } }),
  },
  {
    id: 'incrementalInvestment',
    label: '追加投資額',
    read: (inputs) => toNumber(inputs.stage4.incrementalInvestment),
    write: (inputs, next) =>
      applyPatch(inputs, { stage4: { incrementalInvestment: next } }),
  },
]

function leverScoreById(levers: LeverScore[], id: LeverId): number | null {
  return levers.find((lever) => lever.id === id)?.score ?? null
}

export function analyzeSensitivity(
  inputs: SimulatorInputs,
  criteria: SimulatorCriteria,
  weakestId: LeverId | null,
): SensitivityItem[] {
  const baseLevers = scoreLevers(inputs, criteria)
  const baseComposite = compositeScore(baseLevers)
  if (baseComposite === null) return []

  const baseWeak =
    weakestId === null ? null : leverScoreById(baseLevers, weakestId)

  const raw = SENSITIVITY_VARS.map((variable) => {
    const current = variable.read(inputs)
    if (current === null || current === 0) {
      return { id: variable.id, label: variable.label, impact: 0, sharePct: 0 }
    }

    const upLevers = scoreLevers(variable.write(inputs, current * 1.2), criteria)
    const downLevers = scoreLevers(variable.write(inputs, current * 0.8), criteria)
    const upComposite = compositeScore(upLevers)
    const downComposite = compositeScore(downLevers)

    const compositeSwing =
      Math.abs((upComposite ?? baseComposite) - baseComposite) +
      Math.abs((downComposite ?? baseComposite) - baseComposite)

    const weakSwing =
      weakestId === null || baseWeak === null
        ? 0
        : Math.abs((leverScoreById(upLevers, weakestId) ?? baseWeak) - baseWeak) +
          Math.abs((leverScoreById(downLevers, weakestId) ?? baseWeak) - baseWeak)

    return {
      id: variable.id,
      label: variable.label,
      impact: compositeSwing + weakSwing * 1.25,
      sharePct: 0,
    }
  })

  const total = raw.reduce((sum, item) => sum + item.impact, 0)
  const ranked = raw
    .map((item) => ({
      ...item,
      sharePct: total === 0 ? 0 : (item.impact / total) * 100,
    }))
    .sort((a, b) => b.impact - a.impact || a.label.localeCompare(b.label, 'ja'))

  return ranked.filter((item) => item.impact > 0).slice(0, 3)
}

function roundNice(value: number): number {
  if (Math.abs(value) >= 1000) return Math.round(value)
  return Number(value.toFixed(2))
}

function shiftPaidRate(inputs: SimulatorInputs, deltaPt: number): number | null {
  const contacted = toNumber(inputs.stage2.contactedCustomers)
  const rate = calcPaidRate(inputs.stage2)
  if (contacted === null || contacted <= 0 || rate === null) return null
  return (rate + deltaPt) / 100 * contacted
}

function recommendForMarket(inputs: SimulatorInputs): RecommendedAction[] {
  const customers = toNumber(inputs.stage1.targetCustomers)
  const rate = toNumber(inputs.stage1.acquisitionRatePct)
  const unit = toNumber(inputs.stage1.annualCustomerValue)
  const base = calcMarketPotential(inputs.stage1)

  const actions: RecommendedAction[] = []

  if (customers !== null && customers > 0) {
    const next = roundNice(customers * 1.4)
    const patched = applyPatch(inputs, { stage1: { targetCustomers: next } })
    const after = calcMarketPotential(patched.stage1)
    actions.push({
      id: 'market-widen',
      name: 'ターゲット定義を広げる',
      body: '隣接セグメントまで顧客定義を広げ、到達できる人数の上限を検証する。',
      impacts: [
        `ターゲット顧客数 +40%`,
        after !== null && base !== null
          ? `現実的年間売上ポテンシャル ${formatYen(base)} → ${formatYen(after)}`
          : '現実的年間売上ポテンシャルが増加',
      ],
      budget: '80〜150万円',
      patch: { stage1: { targetCustomers: next } },
    })
  }

  if (unit !== null && unit > 0) {
    const next = roundNice(unit * 1.25)
    const patched = applyPatch(inputs, { stage1: { annualCustomerValue: next } })
    const after = calcMarketPotential(patched.stage1)
    actions.push({
      id: 'market-price-up',
      name: '単価を上げる検証をする',
      body: '上位プランやセット販売で、年間顧客単価を25%引き上げられるかを少数で試す。',
      impacts: [
        `年間顧客単価 +25%`,
        after !== null && base !== null
          ? `現実的年間売上ポテンシャル ${formatYen(base)} → ${formatYen(after)}`
          : '現実的年間売上ポテンシャルが増加',
      ],
      budget: '50〜120万円',
      patch: { stage1: { annualCustomerValue: next } },
    })
  }

  if (rate !== null && rate > 0) {
    const next = roundNice(rate * 1.2)
    const patched = applyPatch(inputs, { stage1: { acquisitionRatePct: next } })
    const after = calcMarketPotential(patched.stage1)
    actions.push({
      id: 'market-rate',
      name: '獲得可能率の前提を検証する',
      body: '想定より狭いチャネルに寄せ、獲得可能率の現実的な上限を取り直す。',
      impacts: [
        `獲得可能率 +20%`,
        after !== null && base !== null
          ? `現実的年間売上ポテンシャル ${formatYen(base)} → ${formatYen(after)}`
          : '現実的年間売上ポテンシャルが増加',
      ],
      budget: '60〜100万円',
      patch: { stage1: { acquisitionRatePct: next } },
    })
  }

  return actions.slice(0, 3)
}

function recommendForAcquisition(inputs: SimulatorInputs): RecommendedAction[] {
  const rate = calcPaidRate(inputs.stage2)
  const unitPrice = toNumber(inputs.stage3.unitPrice)
  const annual = toNumber(inputs.stage1.annualCustomerValue)
  const customers = toNumber(inputs.stage1.targetCustomers)
  const acqRate = toNumber(inputs.stage1.acquisitionRatePct)
  const actions: RecommendedAction[] = []

  const cheaperPaid = shiftPaidRate(inputs, 2.5)
  if (cheaperPaid !== null && unitPrice !== null && annual !== null) {
    actions.push({
      id: 'acq-price-cut',
      name: '価格を15%下げてテストする',
      body: '入口価格を下げ、支払い意思が価格に弾力的かどうかを少数で確認する。',
      impacts: [
        `有料化率 +2.5pt`,
        `顧客単価 -15%`,
        `年間顧客単価 -15%`,
      ],
      budget: '80〜180万円',
      patch: {
        stage1: { annualCustomerValue: roundNice(annual * 0.85) },
        stage2: { paidCustomers: roundNice(cheaperPaid) },
        stage3: { unitPrice: roundNice(unitPrice * 0.85) },
      },
    })
  }

  const lpPaid = shiftPaidRate(inputs, 2)
  if (lpPaid !== null && customers !== null && acqRate !== null) {
    actions.push({
      id: 'acq-lp-focus',
      name: 'ターゲットを絞ってLPを作り直す',
      body: '広い獲得より、刺さる層だけにメッセージを寄せて有料化率を上げる。',
      impacts: [
        `有料化率 +2.0pt`,
        `ターゲット顧客数 -30%`,
        `獲得可能率 +15%`,
      ],
      budget: '100〜250万円',
      patch: {
        stage1: {
          targetCustomers: roundNice(customers * 0.7),
          acquisitionRatePct: roundNice(acqRate * 1.15),
        },
        stage2: { paidCustomers: roundNice(lpPaid) },
      },
    })
  }

  const supportPaid = shiftPaidRate(inputs, 1.5)
  const cac = toNumber(inputs.stage3.acquisitionCost)
  if (supportPaid !== null) {
    actions.push({
      id: 'acq-onboarding',
      name: '導入支援を厚くする',
      body: '購入前後の説明と伴走を足し、検討中の層を有料化まで運ぶ。',
      impacts: [
        `有料化率 +1.5pt`,
        rate !== null ? `有効有料化率 ${formatPct(rate, 2)} → ${formatPct(rate + 1.5, 2)}` : '有効有料化率が改善',
        cac !== null ? `顧客獲得費用 +10%` : '獲得費用は微増',
      ],
      budget: '120〜300万円',
      patch: {
        stage2: { paidCustomers: roundNice(supportPaid) },
        stage3: cac !== null ? { acquisitionCost: roundNice(cac * 1.1) } : undefined,
      },
    })
  }

  return actions.slice(0, 3)
}

function recommendForUnit(inputs: SimulatorInputs): RecommendedAction[] {
  const cac = toNumber(inputs.stage3.acquisitionCost)
  const months = toNumber(inputs.stage3.retentionMonths)
  const before = calcUnitEconomics(inputs.stage3)
  const actions: RecommendedAction[] = []

  if (cac !== null && cac > 0) {
    const next = roundNice(cac * 0.75)
    const after = calcUnitEconomics({ ...inputs.stage3, acquisitionCost: next })
    actions.push({
      id: 'unit-channel',
      name: '獲得チャネルを見直す',
      body: '単価の高い流入を止め、より安いチャネルへ寄せて顧客獲得費用を25%下げる。',
      impacts: [
        `顧客獲得費用 -25%`,
        after.efficiency !== null && before.efficiency !== null
          ? `顧客獲得効率 ${formatMultiple(before.efficiency)} → ${formatMultiple(after.efficiency)}`
          : '顧客獲得効率が改善',
      ],
      budget: '80〜200万円',
      patch: { stage3: { acquisitionCost: next } },
    })
  }

  const referralPaid = shiftPaidRate(inputs, 0.8)
  if (cac !== null && cac > 0) {
    const nextCac = roundNice(cac * 0.85)
    actions.push({
      id: 'unit-referral',
      name: '紹介制度を試す',
      body: '既存顧客からの紹介で、広告に頼らない獲得を小さく回す。',
      impacts: [
        `顧客獲得費用 -15%`,
        `有料化率 +0.8pt`,
      ],
      budget: '50〜120万円',
      patch: {
        stage2: referralPaid !== null ? { paidCustomers: roundNice(referralPaid) } : undefined,
        stage3: { acquisitionCost: nextCac },
      },
    })
  }

  if (months !== null && months > 0) {
    const next = roundNice(months * 1.25)
    const after = calcUnitEconomics({ ...inputs.stage3, retentionMonths: next })
    actions.push({
      id: 'unit-retention',
      name: '継続期間を伸ばす施策を入れる',
      body: 'オンボーディングと定期接点を足し、平均継続を25%伸ばせるかを見る。',
      impacts: [
        `平均継続期間 +25%`,
        after.efficiency !== null && before.efficiency !== null
          ? `顧客獲得効率 ${formatMultiple(before.efficiency)} → ${formatMultiple(after.efficiency)}`
          : '顧客獲得効率が改善',
        after.paybackMonths !== null
          ? `推定回収期間 ${formatMonths(after.paybackMonths)}`
          : '回収期間を維持',
      ],
      budget: '100〜250万円',
      patch: { stage3: { retentionMonths: next } },
    })
  }

  return actions.slice(0, 3)
}

function recommendForScale(inputs: SimulatorInputs): RecommendedAction[] {
  const profit = toNumber(inputs.stage4.incrementalGrossProfit)
  const invest = toNumber(inputs.stage4.incrementalInvestment)
  const base = calcGrowthEfficiency(inputs.stage4)
  const actions: RecommendedAction[] = []

  if (invest !== null && invest > 0) {
    const next = roundNice(invest * 0.8)
    const after = calcGrowthEfficiency({
      ...inputs.stage4,
      incrementalInvestment: next,
    })
    actions.push({
      id: 'scale-focus',
      name: '追加投資の使い道を絞り込む',
      body: '効果が薄い施策を止め、同じ粗利益をより少ない追加投資で取りにいく。',
      impacts: [
        `追加投資額 -20%`,
        after !== null && base !== null
          ? `限界投資効率 ${formatMultiple(base)} → ${formatMultiple(after)}`
          : '限界投資効率が改善',
      ],
      budget: '既存予算の組み替えが中心',
      patch: { stage4: { incrementalInvestment: next } },
    })
  }

  if (profit !== null && profit > 0) {
    const next = roundNice(profit * 1.2)
    const after = calcGrowthEfficiency({
      ...inputs.stage4,
      incrementalGrossProfit: next,
    })
    actions.push({
      id: 'scale-channel',
      name: '勝ちチャネルに予算を寄せる',
      body: 'すでに効いている打ち手だけに追加投資を集中し、増分粗利益を20%伸ばす。',
      impacts: [
        `追加投資で増えた粗利益 +20%`,
        after !== null && base !== null
          ? `限界投資効率 ${formatMultiple(base)} → ${formatMultiple(after)}`
          : '限界投資効率が改善',
      ],
      budget: '200〜600万円',
      patch: { stage4: { incrementalGrossProfit: next } },
    })
  }

  if (invest !== null && profit !== null && invest > 0) {
    actions.push({
      id: 'scale-smaller',
      name: '実験単位を小さくする',
      body: '大きな追加投資を止め、小さな実験の積み上げに切り替えて効率を見る。',
      impacts: [
        `追加投資額 -30%`,
        `増分粗利益 -15%`,
        `限界投資効率が改善しやすい形に再設計`,
      ],
      budget: '150〜400万円',
      patch: {
        stage4: {
          incrementalInvestment: roundNice(invest * 0.7),
          incrementalGrossProfit: roundNice(profit * 0.85),
        },
      },
    })
  }

  return actions.slice(0, 3)
}

export function recommendActions(
  inputs: SimulatorInputs,
  weakest: LeverScore | null,
): RecommendedAction[] {
  if (weakest === null) return []
  switch (weakest.id) {
    case 'market':
      return recommendForMarket(inputs)
    case 'acquisition':
      return recommendForAcquisition(inputs)
    case 'unit':
      return recommendForUnit(inputs)
    case 'scale':
      return recommendForScale(inputs)
  }
}

export function buildJudgmentComment(
  overall: OverallStatus,
  levers: LeverScore[],
  strongest: LeverScore | null,
  weakest: LeverScore | null,
): string {
  const valid = validScores(levers)
  if (valid.length === 0 || strongest === null || weakest === null) {
    return '入力が揃わないと診断できません。各ステージの数字を入れてから、勝ち筋を読み直してください。'
  }

  const spread = (strongest.score ?? 0) - (weakest.score ?? 0)
  const midCount = valid.filter((lever) => {
    const score = lever.score ?? 0
    return score >= 40 && score <= 75
  }).length

  if (spread < 4) {
    return '全体的に基準付近。勝ち筋が明確でないため、①の市場規模を伸ばすか、②の有料化率を劇的に改善しない限り投資継続は推奨しない。'
  }

  if (
    weakest.id === 'market' &&
    strongest.id === 'unit' &&
    (strongest.score ?? 0) >= 80 &&
    (weakest.score ?? 0) < 60
  ) {
    return '市場規模は弱いが、ユニットエコノミクスが非常に強い。まずは獲得効率を維持したまま、ターゲットを広げる検証を優先すべき。'
  }

  if (overall === 'all_pass') {
    return `4つの関門は通過している。勝ち筋は${strongest.label}。ボトルネックの${weakest.label}を先に伸ばすと、拡大の再現性が上がる。`
  }

  if (overall === 'partial_kill') {
    return `撤退基準に抵触している。特に${weakest.label}が足を引っ張っている。投資を積むより、このレバーの前提を検証し直すべき。`
  }

  if (weakest.id === 'acquisition') {
    return `${strongest.label}は相対的に強い一方、顧客獲得の歩留まりがボトルネック。有料化が伸びないと、良い単体採算も積み上がらない。`
  }

  if (weakest.id === 'unit') {
    return `獲得側は見えても利益構造が弱い。単価・継続・獲得費用のどこを動かすかを先に決めないと、拡大しても回収できない。`
  }

  if (weakest.id === 'scale') {
    return `足元の単体指標はあっても、追加投資の効率が弱い。拡大の前に、投資の使い道を絞る検証を入れるべき。`
  }

  if (midCount >= 3) {
    return '全体的に基準付近。勝ち筋が明確でないため、①の市場規模を伸ばすか、②の有料化率を劇的に改善しない限り投資継続は推奨しない。'
  }

  return `${weakest.label}が弱みで、${strongest.label}が勝ち筋。勝ち筋を崩さない前提で、ボトルネック側の数字だけを動かす検証を優先すべき。`
}

export function diagnose(
  inputs: SimulatorInputs,
  criteria: SimulatorCriteria,
  overall: OverallStatus,
): DiagnosisResult {
  const levers = scoreLevers(inputs, criteria)
  const strongest = pickStrongest(levers)
  const weakest = pickWeakest(levers)
  const tied =
    strongest !== null &&
    weakest !== null &&
    strongest.id === weakest.id

  return {
    levers,
    strongest: tied ? strongest : strongest,
    weakest: tied ? null : weakest,
    tied,
    sensitivities: analyzeSensitivity(inputs, criteria, tied ? null : (weakest?.id ?? null)),
    actions: recommendActions(inputs, tied ? strongest : weakest),
    comment: buildJudgmentComment(overall, levers, strongest, tied ? strongest : weakest),
  }
}

export function formatScore(score: number | null): string {
  if (score === null) return '計算不可'
  return `${trimDecimal(score, 0)}点`
}
