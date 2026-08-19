import { evaluateEngine } from './calc'
import { compareCompetition, defaultCompetitors } from './competition'
import { diagnose } from './diagnosis'
import { clonePreset } from './presets'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

const saas = clonePreset('saas')
const rivals = defaultCompetitors('saas')
assert(rivals.length === 2, '初期競合は2社')
assert(rivals[0].position === '市場リーダー', '1社目は市場リーダー')
assert(rivals[1].position === '新興勢力', '2社目は新興勢力')

const result = evaluateEngine(saas, saas.criteria)
const diagnosis = diagnose(saas, saas.criteria, result.overall)
const view = compareCompetition(
  diagnosis.levers,
  saas,
  saas.criteria,
  rivals,
  result.market.value,
)

assert(view.axes.length === 5, '比較軸は5本')
assert(view.comment.length > 10, 'コメントがある')
const marketAxis = view.axes.find((axis) => axis.id === 'market')
assert(marketAxis !== undefined, '市場軸がある')
assert(marketAxis?.series[0]?.id === 'self', '先頭は自社')
assert((marketAxis?.series.length ?? 0) === 3, '自社+2社')

const leaderMarket = marketAxis?.series.find((row) => row.name === '競合A')?.score
const selfMarket = marketAxis?.series[0]?.score
assert(
  leaderMarket !== null &&
    leaderMarket !== undefined &&
    selfMarket !== null &&
    selfMarket !== undefined &&
    leaderMarket > selfMarket,
  'リーダーの売上規模は自社より高く出るはず',
)

console.log('競合分析の検証に通過しました')
