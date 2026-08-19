import { clonePreset } from './presets'
import {
  calcGrowthEfficiency,
  calcMarketPotential,
  calcPaidRate,
  calcUnitEconomics,
  evaluateEngine,
} from './calc'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

const saas = clonePreset('saas')

const market = calcMarketPotential(saas.stage1)
assert(market === 250_000_000, `市場機会が想定と違う: ${market}`)

const paid = calcPaidRate(saas.stage2)
assert(paid !== null && Math.abs(paid - 6.25) < 1e-9, `有料化率が想定と違う: ${paid}`)

const unit = calcUnitEconomics(saas.stage3)
assert(unit.efficiency === 4.8, `獲得効率が想定と違う: ${unit.efficiency}`)
assert(unit.paybackMonths === 5, `回収期間が想定と違う: ${unit.paybackMonths}`)

const growth = calcGrowthEfficiency(saas.stage4)
assert(growth === 1.875, `限界投資効率が想定と違う: ${growth}`)

const zeroPaid = calcPaidRate({ paidCustomers: 10, contactedCustomers: 0 })
assert(zeroPaid === null, 'ゼロ除算を検出できていない')

const evaluated = evaluateEngine(saas, saas.criteria)
assert(evaluated.market.verdict === 'review', 'SaaS初期の市場は要検討のはず')
assert(evaluated.paid.verdict === 'pass', 'SaaS初期の有料化はPASSのはず')
assert(evaluated.unit.verdict === 'pass', 'SaaS初期のユニット経済はPASSのはず')
assert(evaluated.growth.verdict === 'pass', 'SaaS初期の成長効率はPASSのはず')
assert(evaluated.overall === 'review', '先頭が要検討なら全体も要検討')

const killMarket = {
  ...saas,
  stage1: { ...saas.stage1, targetCustomers: 10_000 },
}
const killed = evaluateEngine(killMarket, saas.criteria)
assert(killed.market.verdict === 'kill', '売上ポテンシャル低下でKILLになるはず')
assert(killed.overall === 'partial_kill', 'KILLなら全体は一部KILL')
assert(killed.firstKillIndex === 0, '最初のKILLはステージ1')

console.log('計算検証に通過しました')
