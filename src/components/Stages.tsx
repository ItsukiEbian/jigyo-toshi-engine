import type { ReactNode } from 'react'
import type { SimulatorCriteria, SimulatorInputs, Verdict } from '../types'
import {
  formatInput,
  formatMultiple,
  formatMonths,
  formatPct,
  formatYen,
  formatYenExact,
} from '../lib/format'
import type { EngineResult } from '../lib/calc'
import { NumberField } from './NumberField'
import { FormulaBlock, FormulaLine, MetricValue, SectionLabel } from './uiBits'
import { FlowBranch, StageShell } from './StageShell'
import { STAGE_META } from '../lib/presets'

type StagesProps = {
  inputs: SimulatorInputs
  criteria: SimulatorCriteria
  result: EngineResult
  onInputs: (next: SimulatorInputs) => void
  onCriteria: (next: SimulatorCriteria) => void
}

export function Stages({ inputs, criteria, result, onInputs, onCriteria }: StagesProps) {
  const shells = [
    {
      meta: STAGE_META[0],
      verdict: result.market.verdict,
      body: (
        <StageMarket
          inputs={inputs}
          criteria={criteria}
          value={result.market.value}
          verdict={result.market.verdict}
          onInputs={onInputs}
          onCriteria={onCriteria}
        />
      ),
    },
    {
      meta: STAGE_META[1],
      verdict: result.paid.verdict,
      body: (
        <StagePaid
          inputs={inputs}
          criteria={criteria}
          value={result.paid.value}
          verdict={result.paid.verdict}
          onInputs={onInputs}
          onCriteria={onCriteria}
        />
      ),
    },
    {
      meta: STAGE_META[2],
      verdict: result.unit.verdict,
      body: (
        <StageUnit
          inputs={inputs}
          criteria={criteria}
          efficiency={result.unit.efficiency}
          paybackMonths={result.unit.paybackMonths}
          monthlyGrossProfit={result.unit.monthlyGrossProfit}
          verdict={result.unit.verdict}
          onInputs={onInputs}
          onCriteria={onCriteria}
        />
      ),
    },
    {
      meta: STAGE_META[3],
      verdict: result.growth.verdict,
      body: (
        <StageGrowth
          inputs={inputs}
          criteria={criteria}
          value={result.growth.value}
          verdict={result.growth.verdict}
          onInputs={onInputs}
          onCriteria={onCriteria}
        />
      ),
    },
  ]

  return (
    <div>
      {shells.map((stage, index) => {
        const blocked =
          result.firstKillIndex !== null && index > result.firstKillIndex
        return (
          <div key={stage.meta.id}>
            <StageShell
              numeral={stage.meta.numeral}
              title={stage.meta.title}
              budget={stage.meta.budget}
              verdict={stage.verdict}
              blocked={blocked}
              passUnlocked={stage.verdict === 'pass'}
              nextName={stage.meta.nextName}
              isCurrent={result.currentStageIndex === index}
            >
              {stage.body}
            </StageShell>
            <FlowBranch verdict={stage.verdict} isLast={index === shells.length - 1} />
          </div>
        )
      })}
    </div>
  )
}

function StageMarket({
  inputs,
  criteria,
  value,
  verdict,
  onInputs,
  onCriteria,
}: {
  inputs: SimulatorInputs
  criteria: SimulatorCriteria
  value: number | null
  verdict: Verdict
  onInputs: (next: SimulatorInputs) => void
  onCriteria: (next: SimulatorCriteria) => void
}) {
  const s = inputs.stage1
  return (
    <div className="space-y-5">
      <FormulaBlock
        verdict={verdict}
        name="計算式"
        formula={
          <FormulaLine
            tokens={[
              '現実的年間売上ポテンシャル',
              '＝',
              'ターゲット顧客数',
              '×',
              '獲得可能率',
              '×',
              '年間顧客単価',
            ]}
          />
        }
        substitution={`＝ ${formatInput(s.targetCustomers, '人')} × ${formatInput(s.acquisitionRatePct, '%')} × ${formatInput(s.annualCustomerValue, '円')}`}
      >
        {value === null ? (
          <MetricValue value="計算不可" caption="入力値が不足しているか、数値として扱えません" />
        ) : (
          <MetricValue value={formatYen(value)} caption={formatYenExact(value)} />
        )}
      </FormulaBlock>

      <div>
        <SectionLabel>入力</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField
            label="ターゲット顧客数"
            fieldId="target-customers"
            unit="人"
            value={s.targetCustomers}
            onChange={(targetCustomers) =>
              onInputs({ ...inputs, stage1: { ...s, targetCustomers } })
            }
          />
          <NumberField
            label="獲得可能率"
            fieldId="acquisition-rate"
            unit="%"
            step={0.1}
            min={0}
            value={s.acquisitionRatePct}
            onChange={(acquisitionRatePct) =>
              onInputs({ ...inputs, stage1: { ...s, acquisitionRatePct } })
            }
            hint="内部では小数（5% → 0.05）で計算"
          />
          <NumberField
            label="年間顧客単価"
            fieldId="annual-unit-price"
            unit="円"
            value={s.annualCustomerValue}
            onChange={(annualCustomerValue) =>
              onInputs({ ...inputs, stage1: { ...s, annualCustomerValue } })
            }
          />
        </div>
      </div>

      <CriteriaBox>
        <NumberField
          label="PASS基準"
          unit="億円以上"
          step={0.1}
          value={criteria.stage1.passOku}
          onChange={(passOku) =>
            onCriteria({ ...criteria, stage1: { ...criteria.stage1, passOku } })
          }
        />
        <NumberField
          label="KILL基準"
          unit="億円未満"
          step={0.1}
          value={criteria.stage1.killOku}
          onChange={(killOku) =>
            onCriteria({ ...criteria, stage1: { ...criteria.stage1, killOku } })
          }
        />
      </CriteriaBox>
    </div>
  )
}

function StagePaid({
  inputs,
  criteria,
  value,
  verdict,
  onInputs,
  onCriteria,
}: {
  inputs: SimulatorInputs
  criteria: SimulatorCriteria
  value: number | null
  verdict: Verdict
  onInputs: (next: SimulatorInputs) => void
  onCriteria: (next: SimulatorCriteria) => void
}) {
  const s = inputs.stage2
  return (
    <div className="space-y-5">
      <FormulaBlock
        verdict={verdict}
        name="計算式"
        formula={
          <FormulaLine
            tokens={[
              '有効有料化率',
              '＝',
              '有料顧客数',
              '÷',
              '購入対象として接触した顧客数',
            ]}
          />
        }
        substitution={`＝ ${formatInput(s.paidCustomers, '人')} ÷ ${formatInput(s.contactedCustomers, '人')}`}
      >
        {value === null ? (
          <MetricValue value="計算不可" caption="接触顧客数が0、または入力が不足しています" />
        ) : (
          <MetricValue value={formatPct(value, 2)} />
        )}
      </FormulaBlock>

      <div>
        <SectionLabel>入力</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="有料顧客数"
            fieldId="paid-customers"
            unit="人"
            min={0}
            value={s.paidCustomers}
            onChange={(paidCustomers) =>
              onInputs({ ...inputs, stage2: { ...s, paidCustomers } })
            }
          />
          <NumberField
            label="接触顧客数"
            fieldId="contacted-customers"
            unit="人"
            min={0}
            value={s.contactedCustomers}
            onChange={(contactedCustomers) =>
              onInputs({ ...inputs, stage2: { ...s, contactedCustomers } })
            }
          />
        </div>
      </div>

      <CriteriaBox>
        <NumberField
          label="PASS基準"
          unit="%以上"
          step={0.1}
          value={criteria.stage2.passPct}
          onChange={(passPct) =>
            onCriteria({ ...criteria, stage2: { ...criteria.stage2, passPct } })
          }
        />
        <NumberField
          label="KILL基準"
          unit="%未満"
          step={0.1}
          value={criteria.stage2.killPct}
          onChange={(killPct) =>
            onCriteria({ ...criteria, stage2: { ...criteria.stage2, killPct } })
          }
        />
      </CriteriaBox>
    </div>
  )
}

function StageUnit({
  inputs,
  criteria,
  efficiency,
  paybackMonths,
  monthlyGrossProfit,
  verdict,
  onInputs,
  onCriteria,
}: {
  inputs: SimulatorInputs
  criteria: SimulatorCriteria
  efficiency: number | null
  paybackMonths: number | null
  monthlyGrossProfit: number | null
  verdict: Verdict
  onInputs: (next: SimulatorInputs) => void
  onCriteria: (next: SimulatorCriteria) => void
}) {
  const s = inputs.stage3
  return (
    <div className="space-y-5">
      <FormulaBlock
        verdict={verdict}
        name="計算式"
        formula={
          <FormulaLine
            tokens={[
              '顧客獲得効率',
              '＝',
              '（',
              '顧客単価',
              '×',
              '粗利益率',
              '×',
              '平均継続期間',
              '）',
              '÷',
              '顧客獲得費用',
            ]}
          />
        }
        substitution={`＝（${formatInput(s.unitPrice, '円')} × ${formatInput(s.grossMarginPct, '%')} × ${formatInput(s.retentionMonths, 'ヶ月')}）÷ ${formatInput(s.acquisitionCost, '円')}`}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold tracking-wide text-slate-500">顧客獲得効率</p>
            <div className="mt-1">
              {efficiency === null ? (
                <MetricValue value="計算不可" />
              ) : (
                <MetricValue value={formatMultiple(efficiency)} />
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wide text-slate-500">推定回収期間</p>
            <div className="mt-1">
              {paybackMonths === null ? (
                <MetricValue value="計算不可" />
              ) : (
                <MetricValue
                  value={formatMonths(paybackMonths)}
                  caption={
                    monthlyGrossProfit !== null
                      ? `月あたり粗利益 ${formatYen(monthlyGrossProfit)}`
                      : undefined
                  }
                />
              )}
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          顧客単価は1ヶ月あたりの売上として計算します。回収期間 ＝ 顧客獲得費用 ÷ 月あたり粗利益。
        </p>
      </FormulaBlock>

      <div>
        <SectionLabel>入力</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="顧客単価"
            unit="円"
            value={s.unitPrice}
            onChange={(unitPrice) => onInputs({ ...inputs, stage3: { ...s, unitPrice } })}
          />
          <NumberField
            label="粗利益率"
            unit="%"
            step={0.1}
            value={s.grossMarginPct}
            onChange={(grossMarginPct) =>
              onInputs({ ...inputs, stage3: { ...s, grossMarginPct } })
            }
          />
          <NumberField
            label="平均継続期間"
            unit="ヶ月"
            step={0.1}
            value={s.retentionMonths}
            onChange={(retentionMonths) =>
              onInputs({ ...inputs, stage3: { ...s, retentionMonths } })
            }
          />
          <NumberField
            label="顧客獲得費用"
            unit="円"
            value={s.acquisitionCost}
            onChange={(acquisitionCost) =>
              onInputs({ ...inputs, stage3: { ...s, acquisitionCost } })
            }
          />
        </div>
      </div>

      <CriteriaBox>
        <NumberField
          label="PASS：効率"
          unit="倍以上"
          step={0.1}
          value={criteria.stage3.passEfficiency}
          onChange={(passEfficiency) =>
            onCriteria({
              ...criteria,
              stage3: { ...criteria.stage3, passEfficiency },
            })
          }
        />
        <NumberField
          label="PASS：回収期間"
          unit="ヶ月以下"
          step={1}
          value={criteria.stage3.passPaybackMonths}
          onChange={(passPaybackMonths) =>
            onCriteria({
              ...criteria,
              stage3: { ...criteria.stage3, passPaybackMonths },
            })
          }
        />
        <NumberField
          label="KILL：効率"
          unit="倍未満"
          step={0.1}
          value={criteria.stage3.killEfficiency}
          onChange={(killEfficiency) =>
            onCriteria({
              ...criteria,
              stage3: { ...criteria.stage3, killEfficiency },
            })
          }
        />
        <NumberField
          label="KILL：回収期間"
          unit="ヶ月超"
          step={1}
          value={criteria.stage3.killPaybackMonths}
          onChange={(killPaybackMonths) =>
            onCriteria({
              ...criteria,
              stage3: { ...criteria.stage3, killPaybackMonths },
            })
          }
        />
        <p className="sm:col-span-2 text-xs text-slate-500">
          PASSは効率と回収期間の両方を満たすこと。KILLはどちらか一方でも抵触すれば成立します。
        </p>
      </CriteriaBox>
    </div>
  )
}

function StageGrowth({
  inputs,
  criteria,
  value,
  verdict,
  onInputs,
  onCriteria,
}: {
  inputs: SimulatorInputs
  criteria: SimulatorCriteria
  value: number | null
  verdict: Verdict
  onInputs: (next: SimulatorInputs) => void
  onCriteria: (next: SimulatorCriteria) => void
}) {
  const s = inputs.stage4
  return (
    <div className="space-y-5">
      <FormulaBlock
        verdict={verdict}
        name="計算式"
        formula={
          <FormulaLine
            tokens={[
              '限界投資効率',
              '＝',
              '追加投資によって増加した粗利益',
              '÷',
              '追加投資額',
            ]}
          />
        }
        substitution={`＝ ${formatInput(s.incrementalGrossProfit, '円')} ÷ ${formatInput(s.incrementalInvestment, '円')}`}
      >
        {value === null ? (
          <MetricValue value="計算不可" caption="追加投資額が0、または入力が不足しています" />
        ) : (
          <MetricValue value={formatMultiple(value)} />
        )}
      </FormulaBlock>

      <div>
        <SectionLabel>入力</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="追加投資によって増加した粗利益"
            unit="円"
            value={s.incrementalGrossProfit}
            onChange={(incrementalGrossProfit) =>
              onInputs({ ...inputs, stage4: { ...s, incrementalGrossProfit } })
            }
          />
          <NumberField
            label="追加投資額"
            unit="円"
            value={s.incrementalInvestment}
            onChange={(incrementalInvestment) =>
              onInputs({ ...inputs, stage4: { ...s, incrementalInvestment } })
            }
          />
        </div>
      </div>

      <CriteriaBox>
        <NumberField
          label="PASS基準"
          unit="倍以上"
          step={0.1}
          value={criteria.stage4.passMultiple}
          onChange={(passMultiple) =>
            onCriteria({ ...criteria, stage4: { ...criteria.stage4, passMultiple } })
          }
        />
        <NumberField
          label="KILL基準"
          unit="倍未満"
          step={0.1}
          value={criteria.stage4.killMultiple}
          onChange={(killMultiple) =>
            onCriteria({ ...criteria, stage4: { ...criteria.stage4, killMultiple } })
          }
        />
      </CriteriaBox>
    </div>
  )
}

function CriteriaBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
      <SectionLabel>判定基準（変更可）</SectionLabel>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  )
}
