import type { BusinessType, Numeric, SimulatorCriteria, SimulatorInputs } from '../types'
import { toNumber } from './calc'
import type { LeverScore } from './diagnosis'
import { formatYen, trimDecimal } from './format'

export const COMPETITOR_POSITIONS = [
  '市場リーダー',
  '新興勢力',
  'ニッチ特化',
  '価格破壊',
  '大手参入',
] as const

export type Competitor = {
  id: string
  name: string
  position: string
  revenueOku: Numeric
  unitPrice: Numeric
  tags: [string, string, string]
}

export const COMPARE_AXES = [
  { id: 'market', label: '市場規模ポテンシャル' },
  { id: 'acquisition', label: '顧客獲得のしやすさ' },
  { id: 'unit', label: '利益構造の強さ' },
  { id: 'price', label: '価格競争力' },
  { id: 'scale', label: 'スケールの伸びしろ' },
] as const

export type CompareAxisId = (typeof COMPARE_AXES)[number]['id']

export type AxisSeries = {
  id: string
  name: string
  score: number | null
  highlight: 'self-weak' | 'rival-strong' | null
}

export type AxisCompare = {
  id: CompareAxisId
  label: string
  selfWeak: boolean
  series: AxisSeries[]
}

export type CompetitionView = {
  axes: AxisCompare[]
  comment: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function newId(): string {
  return `comp-${Math.random().toString(36).slice(2, 9)}`
}

export function emptyCompetitor(index: number): Competitor {
  return {
    id: newId(),
    name: `競合${['A', 'B', 'C'][index] ?? index + 1}`,
    position: '新興勢力',
    revenueOku: 3,
    unitPrice: 40_000,
    tags: ['', '', ''],
  }
}

export function defaultCompetitors(type: BusinessType): Competitor[] {
  if (type === 'retail') {
    return [
      {
        id: newId(),
        name: '競合A',
        position: '市場リーダー',
        revenueOku: 28,
        unitPrice: 12_000,
        tags: ['流通網', '認知', '品揃え'],
      },
      {
        id: newId(),
        name: '競合B',
        position: '新興勢力',
        revenueOku: 5,
        unitPrice: 8_500,
        tags: ['低価格', 'SNS', '速度'],
      },
    ]
  }

  if (type === 'btob') {
    return [
      {
        id: newId(),
        name: '競合A',
        position: '市場リーダー',
        revenueOku: 65,
        unitPrice: 3_200_000,
        tags: ['導入実績', '営業網', '信頼'],
      },
      {
        id: newId(),
        name: '競合B',
        position: 'ニッチ特化',
        revenueOku: 9,
        unitPrice: 1_800_000,
        tags: ['専門性', '伴走', '業界特化'],
      },
    ]
  }

  return [
    {
      id: newId(),
      name: '競合A',
      position: '市場リーダー',
      revenueOku: 18,
      unitPrice: 84_000,
      tags: ['ブランド', '導入実績', '営業網'],
    },
    {
      id: newId(),
      name: '競合B',
      position: '新興勢力',
      revenueOku: 3.6,
      unitPrice: 36_000,
      tags: ['使いやすさ', '低価格', '成長速度'],
    },
  ]
}

export function competitorStatus(competitor: Competitor, ownPotentialYen: number | null): string {
  const revenue = toNumber(competitor.revenueOku)
  const ownOku = ownPotentialYen === null ? null : ownPotentialYen / 100_000_000
  const position = competitor.position

  if (position === '市場リーダー' || position === '大手参入') {
    if (ownOku !== null && revenue !== null && revenue > ownOku * 2) {
      return '安定拡大期。規模で先行し、シェア維持が主戦場'
    }
    return '安定拡大期。既存顧客の防衛と深耕が中心'
  }
  if (position === '新興勢力' || position === '価格破壊') {
    return '急成長期。顧客の取り合いが起きやすい'
  }
  if (position === 'ニッチ特化') {
    return '特化深耕期。狭い領域で密度を上げている'
  }
  if (revenue !== null && ownOku !== null && revenue > ownOku * 1.5) {
    return '規模で先行している'
  }
  return '位置取りを探っている段階'
}

function leverMap(levers: LeverScore[]): Record<string, number | null> {
  return Object.fromEntries(levers.map((lever) => [lever.id, lever.score]))
}

function positionAcquisition(position: string): number {
  if (position === '市場リーダー') return 86
  if (position === '大手参入') return 80
  if (position === '新興勢力') return 72
  if (position === '価格破壊') return 78
  if (position === 'ニッチ特化') return 61
  return 66
}

function positionUnit(position: string): number {
  if (position === '市場リーダー') return 78
  if (position === '大手参入') return 74
  if (position === 'ニッチ特化') return 76
  if (position === '新興勢力') return 62
  if (position === '価格破壊') return 48
  return 64
}

function positionScale(position: string): number {
  if (position === '市場リーダー') return 84
  if (position === '大手参入') return 82
  if (position === '新興勢力') return 73
  if (position === '価格破壊') return 70
  if (position === 'ニッチ特化') return 56
  return 65
}

function tagShift(tags: string[], keywords: string[], amount: number): number {
  const hay = tags.join(' ')
  return keywords.some((word) => hay.includes(word)) ? amount : 0
}

function scoreMarketFromOku(oku: number | null, passOku: number | null, killOku: number | null): number | null {
  if (oku === null || passOku === null || killOku === null || !(passOku > 0)) return null
  if (oku <= 0) return 0
  if (oku < killOku) return clamp((oku / Math.max(killOku, 0.01)) * 30, 0, 30)
  if (oku < passOku) {
    const span = Math.max(passOku - killOku, 0.01)
    return 30 + ((oku - killOku) / span) * 40
  }
  return clamp(70 + ((oku - passOku) / passOku) * 30, 70, 100)
}

function selfPriceScore(ownPrice: number | null, rivals: Competitor[]): number | null {
  if (ownPrice === null || ownPrice <= 0) return null
  const prices = rivals
    .map((rival) => toNumber(rival.unitPrice))
    .filter((price): price is number => price !== null && price > 0)
  if (prices.length === 0) return 55
  const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length
  return clamp(50 + ((avg - ownPrice) / avg) * 50, 5, 100)
}

function rivalPriceScore(ownPrice: number | null, rivalPrice: number | null): number | null {
  if (ownPrice === null || ownPrice <= 0 || rivalPrice === null || rivalPrice <= 0) return null
  return clamp(50 + ((ownPrice - rivalPrice) / ownPrice) * 50, 5, 100)
}

function rivalScores(
  rival: Competitor,
  own: Record<string, number | null>,
  ownPrice: number | null,
  passOku: number | null,
  killOku: number | null,
  ownPotentialOku: number | null,
): Record<CompareAxisId, number | null> {
  const revenue = toNumber(rival.revenueOku)
  const tags = rival.tags
  const market = scoreMarketFromOku(revenue, passOku, killOku)

  let acquisition = positionAcquisition(rival.position)
  acquisition += tagShift(tags, ['獲得', '営業', 'ブランド', '認知', 'SNS'], 6)
  acquisition = clamp(acquisition, 5, 100)

  let unit = positionUnit(rival.position)
  const rivalPrice = toNumber(rival.unitPrice)
  if (ownPrice !== null && rivalPrice !== null && rivalPrice > ownPrice * 1.2) unit += 6
  if (ownPrice !== null && rivalPrice !== null && rivalPrice < ownPrice * 0.75) unit -= 8
  unit += tagShift(tags, ['粗利', '継続', 'LTV'], 5)
  unit = clamp(unit, 5, 100)

  const price = rivalPriceScore(ownPrice, rivalPrice)

  let scale = positionScale(rival.position)
  if (revenue !== null && ownPotentialOku !== null && ownPotentialOku > 0) {
    scale += clamp(((revenue - ownPotentialOku) / ownPotentialOku) * 12, -10, 14)
  }
  scale += tagShift(tags, ['成長', '速度', '拡大'], 5)
  scale = clamp(scale, 5, 100)

  return {
    market: market ?? (own.market === null ? null : clamp((own.market ?? 50) + 8, 5, 100)),
    acquisition,
    unit,
    price,
    scale,
  }
}

export function compareCompetition(
  levers: LeverScore[],
  inputs: SimulatorInputs,
  criteria: SimulatorCriteria,
  rivals: Competitor[],
  ownPotentialYen: number | null,
): CompetitionView {
  const own = leverMap(levers)
  const ownPrice = toNumber(inputs.stage1.annualCustomerValue)
  const passOku = toNumber(criteria.stage1.passOku)
  const killOku = toNumber(criteria.stage1.killOku)
  const ownPotentialOku = ownPotentialYen === null ? null : ownPotentialYen / 100_000_000
  const priceSelf = selfPriceScore(ownPrice, rivals)

  const selfByAxis: Record<CompareAxisId, number | null> = {
    market: own.market ?? null,
    acquisition: own.acquisition ?? null,
    unit: own.unit ?? null,
    price: priceSelf,
    scale: own.scale ?? null,
  }

  const rivalByAxis = rivals.map((rival) => ({
    rival,
    scores: rivalScores(rival, own, ownPrice, passOku, killOku, ownPotentialOku),
  }))

  const axes: AxisCompare[] = COMPARE_AXES.map((axis) => {
    const selfScore = selfByAxis[axis.id]
    const rivalScoresOnAxis = rivalByAxis.map((entry) => entry.scores[axis.id])
    const knownRivals = rivalScoresOnAxis.filter((score): score is number => score !== null)
    const maxRival = knownRivals.length === 0 ? null : Math.max(...knownRivals)
    const selfWeak =
      selfScore !== null && maxRival !== null && selfScore < maxRival - 1

    const series: AxisSeries[] = [
      {
        id: 'self',
        name: '自社',
        score: selfScore,
        highlight: selfWeak ? 'self-weak' : null,
      },
      ...rivalByAxis.map((entry) => {
        const score = entry.scores[axis.id]
        const clearlyHigher =
          selfScore !== null && score !== null && score >= selfScore + 8
        return {
          id: entry.rival.id,
          name: entry.rival.name || '無名の競合',
          score,
          highlight: clearlyHigher ? ('rival-strong' as const) : null,
        }
      }),
    ]

    return {
      id: axis.id,
      label: axis.label,
      selfWeak,
      series,
    }
  })

  return {
    axes,
    comment: buildCompetitionComment(axes, ownPrice, rivals),
  }
}

function buildCompetitionComment(
  axes: AxisCompare[],
  ownPrice: number | null,
  rivals: Competitor[],
): string {
  if (rivals.length === 0) {
    return '競合を追加すると、自社の位置と弱みが見えるようになります。'
  }

  const weakAxes = axes.filter((axis) => axis.selfWeak)
  const strongRivalHits = axes.flatMap((axis) =>
    axis.series
      .filter((row) => row.id !== 'self' && row.highlight === 'rival-strong')
      .map((row) => ({ axis: axis.label, name: row.name, score: row.score ?? 0 })),
  )

  const closeCount = axes.filter((axis) => {
    const self = axis.series.find((row) => row.id === 'self')?.score
    if (self === null || self === undefined) return false
    return axis.series
      .filter((row) => row.id !== 'self' && row.score !== null)
      .every((row) => Math.abs((row.score ?? 0) - self) < 8)
  }).length

  if (closeCount >= 4) {
    return '全体的に競合と近い水準。明確な勝ち筋を作らないと投資継続はリスクが高い。'
  }

  const topRival = strongRivalHits.sort((a, b) => b.score - a.score)[0]
  const weakest = weakAxes[0]
  const unitStrong = !axes.find((axis) => axis.id === 'unit')?.selfWeak
  const priceWeak = axes.find((axis) => axis.id === 'price')?.selfWeak

  if (topRival && weakest) {
    if (topRival.axis.includes('顧客獲得') && unitStrong) {
      return `${topRival.name}は顧客獲得で優位。自社は単価と利益構造で差別化を図る必要がある。`
    }
    if (weakest.id === 'market') {
      return `${topRival.name}は${topRival.axis}で先行している。自社は市場規模の前提を広げないと、同じ土俵で勝てない。`
    }
    if (priceWeak && ownPrice !== null) {
      return `価格競争力で見劣りしている。${formatYen(ownPrice)}の単価を維持するなら、利益構造か獲得効率で差を見せる必要がある。`
    }
    return `${topRival.name}は${topRival.axis}で優位。自社の弱みは${weakest.label}。ここを動かさないと相対位置は変わらない。`
  }

  if (weakest) {
    return `競合対比で弱いのは${weakest.label}。この軸を先に動かさないと、投資を積んでも差が開きやすい。`
  }

  if (topRival) {
    return `${topRival.name}の${topRival.axis}が目立つ。自社は勝ち筋を維持したまま、この差だけを埋める検証が必要。`
  }

  return '競合対比で大きな負け軸は見えない。勝ち筋を一段はっきりさせれば、投資継続の根拠が強くなる。'
}

export function formatAxisScore(score: number | null): string {
  if (score === null) return '—'
  return `${trimDecimal(score, 0)}`
}
