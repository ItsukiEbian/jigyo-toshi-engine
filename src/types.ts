export type BusinessType = 'saas' | 'retail' | 'btob'

export type Verdict = 'pass' | 'kill' | 'review' | 'invalid'

export type Numeric = number | ''

export type Stage1Inputs = {
  targetCustomers: Numeric
  acquisitionRatePct: Numeric
  annualCustomerValue: Numeric
}

export type Stage2Inputs = {
  paidCustomers: Numeric
  contactedCustomers: Numeric
}

export type Stage3Inputs = {
  unitPrice: Numeric
  grossMarginPct: Numeric
  retentionMonths: Numeric
  acquisitionCost: Numeric
}

export type Stage4Inputs = {
  incrementalGrossProfit: Numeric
  incrementalInvestment: Numeric
}

export type Stage1Criteria = {
  passOku: Numeric
  killOku: Numeric
}

export type Stage2Criteria = {
  passPct: Numeric
  killPct: Numeric
}

export type Stage3Criteria = {
  passEfficiency: Numeric
  passPaybackMonths: Numeric
  killEfficiency: Numeric
  killPaybackMonths: Numeric
}

export type Stage4Criteria = {
  passMultiple: Numeric
  killMultiple: Numeric
}

export type SimulatorInputs = {
  stage1: Stage1Inputs
  stage2: Stage2Inputs
  stage3: Stage3Inputs
  stage4: Stage4Inputs
}

export type SimulatorCriteria = {
  stage1: Stage1Criteria
  stage2: Stage2Criteria
  stage3: Stage3Criteria
  stage4: Stage4Criteria
}

export type SimulatorState = SimulatorInputs & {
  criteria: SimulatorCriteria
}

export type OverallStatus = 'in_progress' | 'review' | 'partial_kill' | 'all_pass'
