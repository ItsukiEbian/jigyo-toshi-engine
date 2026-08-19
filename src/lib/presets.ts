import type { BusinessType, SimulatorState } from '../types'

export const STAGE_META = [
  {
    id: 1 as const,
    numeral: '①',
    title: '市場機会評価',
    short: '市場機会',
    budget: '50〜150万円',
    nextName: '支払意思検証',
  },
  {
    id: 2 as const,
    numeral: '②',
    title: '支払意思検証',
    short: '支払意思',
    budget: '300〜800万円',
    nextName: 'ユニットエコノミクス確立',
  },
  {
    id: 3 as const,
    numeral: '③',
    title: 'ユニットエコノミクス確立',
    short: 'ユニット経済',
    budget: '1,000〜3,000万円',
    nextName: '成長効率検証',
  },
  {
    id: 4 as const,
    numeral: '④',
    title: '成長効率検証',
    short: '成長効率',
    budget: '3,000万円〜1億円',
    nextName: null,
  },
] as const

export const BUSINESS_TYPES: {
  id: BusinessType
  label: string
  description: string
}[] = [
  { id: 'saas', label: 'SaaS', description: '継続課金・高粗利' },
  { id: 'retail', label: '物販', description: '単品・リピート販売' },
  { id: 'btob', label: 'BtoB', description: '法人向け・高単価' },
]

const sharedStage1Criteria = {
  passOku: 5,
  killOku: 1,
}

const sharedStage4Criteria = {
  passMultiple: 1.5,
  killMultiple: 1,
}

export const PRESETS: Record<BusinessType, SimulatorState> = {
  saas: {
    stage1: {
      targetCustomers: 100_000,
      acquisitionRatePct: 5,
      annualCustomerValue: 50_000,
    },
    stage2: {
      paidCustomers: 25,
      contactedCustomers: 400,
    },
    stage3: {
      unitPrice: 10_000,
      grossMarginPct: 80,
      retentionMonths: 24,
      acquisitionCost: 40_000,
    },
    stage4: {
      incrementalGrossProfit: 15_000_000,
      incrementalInvestment: 8_000_000,
    },
    criteria: {
      stage1: { ...sharedStage1Criteria },
      stage2: { passPct: 5, killPct: 1 },
      stage3: {
        passEfficiency: 3,
        passPaybackMonths: 12,
        killEfficiency: 1.5,
        killPaybackMonths: 18,
      },
      stage4: { ...sharedStage4Criteria },
    },
  },
  retail: {
    stage1: {
      targetCustomers: 200_000,
      acquisitionRatePct: 8,
      annualCustomerValue: 18_000,
    },
    stage2: {
      paidCustomers: 90,
      contactedCustomers: 1_000,
    },
    stage3: {
      unitPrice: 6_000,
      grossMarginPct: 40,
      retentionMonths: 6,
      acquisitionCost: 1_800,
    },
    stage4: {
      incrementalGrossProfit: 20_000_000,
      incrementalInvestment: 12_000_000,
    },
    criteria: {
      stage1: { ...sharedStage1Criteria },
      stage2: { passPct: 8, killPct: 2 },
      stage3: {
        passEfficiency: 2.5,
        passPaybackMonths: 6,
        killEfficiency: 1.2,
        killPaybackMonths: 12,
      },
      stage4: { ...sharedStage4Criteria },
    },
  },
  btob: {
    stage1: {
      targetCustomers: 3_000,
      acquisitionRatePct: 15,
      annualCustomerValue: 2_400_000,
    },
    stage2: {
      paidCustomers: 6,
      contactedCustomers: 80,
    },
    stage3: {
      unitPrice: 200_000,
      grossMarginPct: 70,
      retentionMonths: 36,
      acquisitionCost: 900_000,
    },
    stage4: {
      incrementalGrossProfit: 50_000_000,
      incrementalInvestment: 25_000_000,
    },
    criteria: {
      stage1: { ...sharedStage1Criteria },
      stage2: { passPct: 3, killPct: 0.5 },
      stage3: {
        passEfficiency: 4,
        passPaybackMonths: 18,
        killEfficiency: 2,
        killPaybackMonths: 24,
      },
      stage4: { ...sharedStage4Criteria },
    },
  },
}

export function clonePreset(type: BusinessType): SimulatorState {
  return structuredClone(PRESETS[type])
}
