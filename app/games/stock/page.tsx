'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addSession } from '@/lib/storage'

const INITIAL_CASH = 1000
const START_PRICE = 100
const TOTAL_TICKS = 70
const VISIBLE_TICKS = 35
const TICK_MS = 600

type Trade = { idx: number; type: 'buy' | 'sell'; price: number }
type Trend = { dir: 1 | -1; remaining: number }

function nextPrice(prev: number, trendRef: { current: Trend }): number {
  if (trendRef.current.remaining <= 0) {
    trendRef.current = {
      dir: (Math.random() > 0.5 ? 1 : -1) as 1 | -1,
      remaining: 12 + Math.floor(Math.random() * 10),
    }
  }
  const pull = (100 - prev) * 0.025
  const step = trendRef.current.dir * (4 + Math.random() * 9) + pull
  trendRef.current.remaining--
  return Math.max(25, Math.min(230, Math.round(prev + step)))
}

function PriceChart({ prices, trades }: { prices: number[]; trades: Trade[] }) {
  const visible = prices.slice(-VISIBLE_TICKS)
  const W = 300, H = 140
  const vMin = Math.min(...visible)
  const vMax = Math.max(...visible)
  const pad = Math.max((vMax - vMin) * 0.15, 12)
  const yMin = vMin - pad, yMax = vMax + pad

  const toX = (i: number) => (i / (VISIBLE_TICKS - 1)) * W
  const toY = (p: number) => H - ((p - yMin) / (yMax - yMin)) * H

  const pts = visible.map((p, i) => `${toX(i).toFixed(1)},${toY(p).toFixed(1)}`).join(' ')
  const lastX = toX(visible.length - 1)
  const lastY = toY(visible[visible.length - 1])
  const rising = visible[visible.length - 1] >= visible[0]
  const col = rising ? '#16a34a' : '#dc2626'
  const area = `M${toX(0).toFixed(1)},${H} ${pts} L${lastX.toFixed(1)},${H} Z`
  const startIdx = Math.max(0, prices.length - VISIBLE_TICKS)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={col} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)"/>
      <polyline points={pts} fill="none" stroke={col} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
      {trades
        .filter(t => t.idx >= startIdx && t.idx < startIdx + VISIBLE_TICKS)
        .map((t, i) => {
          const x = toX(t.idx - startIdx)
          const y = toY(t.price)
          return t.type === 'buy'
            ? <polygon key={i} points={`${x},${y-4} ${x-5},${y+6} ${x+5},${y+6}`} fill="#16a34a"/>
            : <polygon key={i} points={`${x},${y+4} ${x-5},${y-6} ${x+5},${y-6}`} fill="#dc2626"/>
        })}
      <circle cx={lastX} cy={lastY} r="5" fill={col}/>
    </svg>
  )
}

export default function StockGame() {
  const router = useRouter()
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro')
  const [prices, setPrices] = useState<number[]>([START_PRICE])
  const [currentPrice, setCurrentPrice] = useState(START_PRICE)
  const [cash, setCash] = useState(INITIAL_CASH)
  const [shares, setShares] = useState(0)
  const [trades, setTrades] = useState<Trade[]>([])
  const [feedback, setFeedback] = useState<string | null>(null)
  const [finalValue, setFinalValue] = useState(0)
  const [progress, setProgress] = useState(0)

  const priceRef = useRef(START_PRICE)
  const trendRef = useRef<Trend>({ dir: 1, remaining: 0 })
  const tickRef = useRef(0)
  const cashRef = useRef(INITIAL_CASH)
  const sharesRef = useRef(0)
  const buyPriceRef = useRef(0)
  const tradesRef = useRef<Trade[]>([])

  function showFeedback(msg: string) {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 2000)
  }

  useEffect(() => {
    if (phase !== 'playing') return
    const id = setInterval(() => {
      const p = nextPrice(priceRef.current, trendRef)
      priceRef.current = p
      tickRef.current++
      setPrices(prev => [...prev, p])
      setCurrentPrice(p)
      setProgress(tickRef.current / TOTAL_TICKS)
      if (tickRef.current >= TOTAL_TICKS) {
        clearInterval(id)
        if (sharesRef.current > 0) cashRef.current += sharesRef.current * p
        const fv = Math.round(cashRef.current)
        setFinalValue(fv)
        setCash(fv)
        setShares(0)
        setPhase('done')
      }
    }, TICK_MS)
    return () => clearInterval(id)
  }, [phase])

  const buy = useCallback(() => {
    if (sharesRef.current > 0) return
    const qty = Math.floor(cashRef.current / priceRef.current)
    if (qty === 0) return
    cashRef.current -= qty * priceRef.current
    sharesRef.current = qty
    buyPriceRef.current = priceRef.current
    const t: Trade = { idx: tickRef.current, type: 'buy', price: priceRef.current }
    tradesRef.current = [...tradesRef.current, t]
    setTrades([...tradesRef.current])
    setCash(Math.round(cashRef.current))
    setShares(qty)
    showFeedback(`买入 ${qty} 股 @¥${priceRef.current}`)
  }, [])

  const sell = useCallback(() => {
    if (sharesRef.current === 0) return
    const earned = sharesRef.current * priceRef.current
    const profit = Math.round(earned - sharesRef.current * buyPriceRef.current)
    cashRef.current += earned
    const qty = sharesRef.current
    sharesRef.current = 0
    const t: Trade = { idx: tickRef.current, type: 'sell', price: priceRef.current }
    tradesRef.current = [...tradesRef.current, t]
    setTrades([...tradesRef.current])
    setCash(Math.round(cashRef.current))
    setShares(0)
    showFeedback(`卖出 ${qty} 股，${profit >= 0 ? '+' : ''}¥${profit}`)
  }, [])

  const header = (
    <div className="flex items-center gap-3 mb-3">
      <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
      <h1 className="text-xl font-bold text-slate-800">炒股票</h1>
    </div>
  )

  if (phase === 'intro') {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
        {header}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-600">低</div>
            <p className="text-slate-700 text-lg font-semibold">低价时点<b className="text-emerald-600">买入</b></p>
          </div>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl font-bold text-red-500">高</div>
            <p className="text-slate-700 text-lg font-semibold">高价时点<b className="text-red-500">卖出</b></p>
          </div>
          <p className="text-slate-400 text-sm text-center">起始资金 <b>¥{INITIAL_CASH}</b>，赚得越多越好</p>
        </div>
        <button
          onClick={() => {
            priceRef.current = START_PRICE
            trendRef.current = { dir: 1, remaining: 0 }
            tickRef.current = 0
            cashRef.current = INITIAL_CASH
            sharesRef.current = 0
            tradesRef.current = []
            setPrices([START_PRICE])
            setCurrentPrice(START_PRICE)
            setCash(INITIAL_CASH)
            setShares(0)
            setTrades([])
            setProgress(0)
            setPhase('playing')
          }}
          className="w-full bg-green-600 text-white text-xl font-bold py-5 rounded-2xl"
        >
          开始交易
        </button>
      </div>
    )
  }

  if (phase === 'done') {
    const profit = finalValue - INITIAL_CASH
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 min-h-screen flex flex-col">
        {header}
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-slate-400 mb-1">交易结束！最终资金</p>
          <p className="text-6xl font-bold text-green-600 mb-1">¥{finalValue}</p>
          <p className={`text-xl font-semibold mb-8 ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {profit >= 0 ? `+¥${profit} 盈利` : `-¥${Math.abs(profit)} 亏损`}
          </p>
          <button
            onClick={() => { addSession('stock', '炒股票', finalValue); router.push('/games') }}
            className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl"
          >
            记录并继续
          </button>
        </div>
      </div>
    )
  }

  const portfolioValue = Math.round(cash + shares * currentPrice)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-6">
      {header}

      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${progress * 100}%` }}/>
      </div>

      {/* Fixed-height chart so buttons don't jump */}
      <div className="bg-white rounded-2xl px-3 pt-3 pb-1 shadow-sm border border-slate-100 mb-3" style={{ height: 170 }}>
        <PriceChart prices={prices} trades={trades}/>
      </div>

      {/* Price — fixed height */}
      <div className="text-center mb-2" style={{ height: 72 }}>
        <p className="text-slate-400 text-sm">当前股价</p>
        <p className="text-5xl font-bold text-slate-800">¥{currentPrice}</p>
      </div>

      {/* Feedback — fixed height so buttons stay put */}
      <div className="text-center text-base font-semibold py-2 rounded-xl mb-2" style={{ height: 44, minHeight: 44 }}>
        {feedback && (
          <span className={feedback.includes('+') || feedback.includes('买入') ? 'text-emerald-600' : 'text-red-500'}>
            {feedback}
          </span>
        )}
      </div>

      {/* Portfolio row */}
      <div className="bg-slate-50 rounded-xl px-4 py-2 mb-3 flex justify-between text-sm">
        <div className="text-center">
          <p className="text-slate-400 text-xs">现金</p>
          <p className="font-bold text-slate-700">¥{cash}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-xs">持股</p>
          <p className="font-bold text-slate-700">{shares > 0 ? `${shares}股` : '—'}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-xs">总资产</p>
          <p className={`font-bold ${portfolioValue >= INITIAL_CASH ? 'text-emerald-600' : 'text-red-500'}`}>¥{portfolioValue}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={buy} disabled={shares > 0 || cash < currentPrice}
          className="py-5 rounded-2xl text-white text-xl font-bold bg-emerald-500 active:scale-95 transition-all disabled:opacity-30">
          买入
        </button>
        <button onClick={sell} disabled={shares === 0}
          className="py-5 rounded-2xl text-white text-xl font-bold bg-red-500 active:scale-95 transition-all disabled:opacity-30">
          卖出
        </button>
      </div>
    </div>
  )
}
