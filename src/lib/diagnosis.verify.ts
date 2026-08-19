import { clonePreset } from './presets'
import { applyPatch, diagnose, scoreLevers } from './diagnosis'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

const saas = clonePreset('saas')
const levers = scoreLevers(saas, saas.criteria)
const market = levers.find((lever) => lever.id === 'market')
const unit = levers.find((lever) => lever.id === 'unit')
const acquisition = levers.find((lever) => lever.id === 'acquisition')
if (!market || !unit || !acquisition) throw new Error('レバーが足りない')

assert(market.score !== null && market.score < 60, `SaaS初期の市場スコアが弱い想定: ${market.score}`)
assert(unit.score !== null && unit.score >= 80, `SaaS初期の利益構造は強いはず: ${unit.score}`)
assert(
  acquisition.score !== null && acquisition.score >= 70,
  `SaaS初期の獲得はPASS圏のはず: ${acquisition.score}`,
)

const diagnosis = diagnose(saas, saas.criteria, 'review')
assert(diagnosis.strongest?.id === 'unit', `勝ち筋は利益構造のはず: ${diagnosis.strongest?.id}`)
assert(diagnosis.weakest?.id === 'market', `ボトルネックは市場のはず: ${diagnosis.weakest?.id}`)
assert(diagnosis.comment.includes('市場規模は弱い'), `コメントが想定と違う: ${diagnosis.comment}`)
assert(diagnosis.sensitivities.length === 3, '感度は上位3件あるはず')
assert(diagnosis.actions.length >= 2, '市場弱みならアクションが2件以上あるはず')

const widened = applyPatch(saas, diagnosis.actions[0].patch)
const after = diagnose(widened, saas.criteria, 'review')
const afterMarket = after.levers.find((lever) => lever.id === 'market')
assert(
  (afterMarket?.score ?? 0) > (market?.score ?? 0),
  'ターゲット拡大で市場スコアが上がるはず',
)

const retail = clonePreset('retail')
const retailDiag = diagnose(retail, retail.criteria, 'review')
assert(retailDiag.levers.every((lever) => lever.score !== null), '物販でも4レバーが計算できる')

const btob = clonePreset('btob')
const btobDiag = diagnose(btob, btob.criteria, 'all_pass')
assert(btobDiag.levers.every((lever) => lever.score !== null), 'BtoBでも4レバーが計算できる')
assert(btobDiag.sensitivities.length > 0, 'BtoBでも感度が出る')

console.log('診断検証に通過しました')
