import type {
  Numeric,
  OverallStatus,
  SimulatorCriteria,
  SimulatorInputs,
  Stage1Criteria,
  Stage1Inputs,
  Stage2Criteria,
  Stage2Inputs,
  Stage3Criteria,
  Stage3Inputs,
  Stage4Criteria,
  Stage4Inputs,
  Verdict,
} from '../types'

export function toNumber(value: Numeric): number | null {
  if (value === '' || typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }
  return value
}

function judgeHigherBetter(
  value: number | null,
  passMin: number | null,
  killBelow: number | null,
): Verdict {
  if (value === null || passMin === null || killBelow === null) return 'invalid'
  if (value < killBelow) return 'kill'
  if (value >= passMin) return 'pass'
  return 'review'
}

export function calcMarketPotential(inputs: Stage1Inputs): number | null {
  const customers = toNumber(inputs.targetCustomers)
  const rate = toNumber(inputs.acquisitionRatePct)
  const unit = toNumber(inputs.annualCustomerValue)
  if (customers === null || rate === null || unit === null) return null
  return customers * (rate / 100) * unit
}

export function judgeMarket(
  inputs: Stage1Inputs,
  criteria: Stage1Criteria,
): { value: number | null; verdict: Verdict } {
  const value = calcMarketPotential(inputs)
  const passYen = toOkuYen(criteria.passOku)
  const killYen = toOkuYen(criteria.killOku)
  return { value, verdict: judgeHigherBetter(value, passYen, killYen) }
}

export function toOkuYen(oku: Numeric): number | null {
  const value = toNumber(oku)
  if (value === null) return null
  return value * 100_000_000
}

export function calcPaidRate(inputs: Stage2Inputs): number | null {
  const paid = toNumber(inputs.paidCustomers)
  const contacted = toNumber(inputs.contactedCustomers)
  if (paid === null || contacted === null) return null
  if (contacted === 0) return null
  return (paid / contacted) * 100
}

export function judgePaidIntent(
  inputs: Stage2Inputs,
  criteria: Stage2Criteria,
): { value: number | null; verdict: Verdict } {
  const value = calcPaidRate(inputs)
  return {
    value,
    verdict: judgeHigherBetter(value, toNumber(criteria.passPct), toNumber(criteria.killPct)),
  }
}

export function calcUnitEconomics(inputs: Stage3Inputs): {
  efficiency: number | null
  paybackMonths: number | null
  monthlyGrossProfit: number | null
} {
  const price = toNumber(inputs.unitPrice)
  const margin = toNumber(inputs.grossMarginPct)
  const months = toNumber(inputs.retentionMonths)
  const cac = toNumber(inputs.acquisitionCost)

  if (price === null || margin === null || months === null || cac === null) {
    return { efficiency: null, paybackMonths: null, monthlyGrossProfit: null }
  }

  const monthlyGrossProfit = price * (margin / 100)
  const efficiency = cac === 0 ? null : (price * (margin / 100) * months) / cac
  const paybackMonths = monthlyGrossProfit === 0 ? null : cac / monthlyGrossProfit

  return { efficiency, paybackMonths, monthlyGrossProfit }
}

export function judgeUnitEconomics(
  inputs: Stage3Inputs,
  criteria: Stage3Criteria,
): {
  efficiency: number | null
  paybackMonths: number | null
  monthlyGrossProfit: number | null
  verdict: Verdict
} {
  const metrics = calcUnitEconomics(inputs)
  const passEff = toNumber(criteria.passEfficiency)
  const passPayback = toNumber(criteria.passPaybackMonths)
  const killEff = toNumber(criteria.killEfficiency)
  const killPayback = toNumber(criteria.killPaybackMonths)

  if (
    metrics.efficiency === null ||
    metrics.paybackMonths === null ||
    passEff === null ||
    passPayback === null ||
    killEff === null ||
    killPayback === null
  ) {
    return { ...metrics, verdict: 'invalid' }
  }

  if (metrics.efficiency < killEff || metrics.paybackMonths > killPayback) {
    return { ...metrics, verdict: 'kill' }
  }
  if (metrics.efficiency >= passEff && metrics.paybackMonths <= passPayback) {
    return { ...metrics, verdict: 'pass' }
  }
  return { ...metrics, verdict: 'review' }
}

export function calcGrowthEfficiency(inputs: Stage4Inputs): number | null {
  const profit = toNumber(inputs.incrementalGrossProfit)
  const investment = toNumber(inputs.incrementalInvestment)
  if (profit === null || investment === null) return null
  if (investment === 0) return null
  return profit / investment
}

export function judgeGrowth(
  inputs: Stage4Inputs,
  criteria: Stage4Criteria,
): { value: number | null; verdict: Verdict } {
  const value = calcGrowthEfficiency(inputs)
  return {
    value,
    verdict: judgeHigherBetter(
      value,
      toNumber(criteria.passMultiple),
      toNumber(criteria.killMultiple),
    ),
  }
}

export type StageSnapshot = {
  id: 1 | 2 | 3 | 4
  verdict: Verdict
}

export type EngineResult = {
  market: ReturnType<typeof judgeMarket>
  paid: ReturnType<typeof judgePaidIntent>
  unit: ReturnType<typeof judgeUnitEconomics>
  growth: ReturnType<typeof judgeGrowth>
  stages: StageSnapshot[]
  currentStageIndex: number
  overall: OverallStatus
  firstKillIndex: number | null
}

export function evaluateEngine(
  inputs: SimulatorInputs,
  criteria: SimulatorCriteria,
): EngineResult {
  const market = judgeMarket(inputs.stage1, criteria.stage1)
  const paid = judgePaidIntent(inputs.stage2, criteria.stage2)
  const unit = judgeUnitEconomics(inputs.stage3, criteria.stage3)
  const growth = judgeGrowth(inputs.stage4, criteria.stage4)

  const stages: StageSnapshot[] = [
    { id: 1, verdict: market.verdict },
    { id: 2, verdict: paid.verdict },
    { id: 3, verdict: unit.verdict },
    { id: 4, verdict: growth.verdict },
  ]

  let currentStageIndex = 3
  let firstKillIndex: number | null = null
  let overall: OverallStatus = 'all_pass'

  for (let i = 0; i < stages.length; i += 1) {
    const verdict = stages[i].verdict
    if (verdict === 'kill') {
      currentStageIndex = i
      firstKillIndex = i
      overall = 'partial_kill'
      break
    }
    if (verdict !== 'pass') {
      currentStageIndex = i
      overall = verdict === 'review' ? 'review' : 'in_progress'
      break
    }
    if (i === stages.length - 1) {
      currentStageIndex = i
      overall = 'all_pass'
    }
  }

  return {
    market,
    paid,
    unit,
    growth,
    stages,
    currentStageIndex,
    overall,
    firstKillIndex,
  }
}

export function overallLabel(status: OverallStatus): string {
  switch (status) {
    case 'all_pass':
      return '全PASS'
    case 'partial_kill':
      return '一部KILL'
    case 'review':
      return '要検討'
    default:
      return '進行中'
  }
}

export function overallDetail(status: OverallStatus): string {
  switch (status) {
    case 'all_pass':
      return '4段階すべてを通過。投資継続が妥当です'
    case 'partial_kill':
      return '撤退基準に抵触した段階があります'
    case 'review':
      return 'PASSにもKILLにも届かない保留ゾーンです'
    default:
      return '入力を確定し、判定を進めてください'
  }
}

export function verdictLabel(verdict: Verdict): string {
  switch (verdict) {
    case 'pass':
      return 'PASS'
    case 'kill':
      return 'KILL'
    case 'review':
      return '要検討'
    default:
      return '計算不可'
  }
}
