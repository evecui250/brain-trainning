'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addSession } from '@/lib/storage'

const INITIAL_CASH = 1000
const START_PRICE = 100
const TOTAL_TICKS = 80
const VISIBLE_TICKS = 40
const TICK_MS = 300

type Trade = { idx: number; type: 'buy' | 'sell'; price: number }

function nextPrice(prev: number): number {
  const drift = (100 - prev) * 0.04
  const noise = (Math.random() - 0.5) * 22
  return Math.max(15, Math.min(280, +(prev + drift + noise).toFixed(1)))
}

function PriceChart({ prices, trades }: { prices: number[]; trades: Trade[] }) {
  const visible = prices.slice(-VISIBLE_TICKS)
  const W = 300, H = 130
  const vMin = Math.min(...visible)
  const vMax = Math.max(...visible)
  const pad = Math.max((vMax - vMin) * 0.12, 8)
  const yMin = vMin - pad
  const yMax = vMax + pad

  const toX = (i: number) => (i / Math.max(VISIBLE_TICKS - 1, 1)) * W
  const toY = (p: number) => H - ((p - yMin) / (yMax - yMin)) * H

  const pts = visible.map((p, i) => `${toX(i).toFixed(1)},${toY(p).toFixed(1)}`).join(' ')
  const lastX = toX(visible.length - 1)
  const lastY = toY(visible[visible.length - 1])
  const rising = visible[visible.length - 1] >= visible[0]
  const lineColor = rising ? '#16a34a' : '#ef4444'
  const areaPath = `M${toX(0).toFixed(1)},${H} ${pts} L${lastX.toFixed(1)},${H} Z`
  const startIdx = Math.max(0, prices.length - VISIBLE_TICKS)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ height: H }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={lineColor} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sg)"/>
      <polyline points={pts} fill="none" stroke={lineColor} strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round"/>
      {trades
        .filter(t => t.idx >= startIdx && t.idx < startIdx + VISIBLE_TICKS)
        .map((t, i) => {
          const x = toX(t.idx - startIdx)
          const y = toY(t.price)
          return t.type === 'buy'
            ? <polygon key={i} points={`${x},${y-4} ${x-5},${y+6} ${x+5},${y+6}`} fill="#16a34a"/>
            : <polygon key={i} points={`${x},${y+4} ${x-5},${y-6} ${x+5},${y-6}`} fill="#ef4444"/>
        })}
      <circle cx={lastX} cy={lastY} r="5" fill={lineColor}/>
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
  const [feedback, setFeedback] = useState<{ msg: string; positive: boolean } | null>(null)
  const [finalValue, setFinalValue] = useState(0)
  const [progress, setProgress] = useState(0)

  const priceRef = useRef(START_PRICE)
  const tickRef = useRef(0)
  const cashRef = useRef(INITIAL_CASH)
  const sharesRef = useRef(0)
  const buyPriceRef = useRef(0)
  const tradesRef = useRef<Trade[]>([])
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showFeedback(msg: string, positive: boolean) {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    setFeedback({ msg, positive })
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 1800)
  }

  useEffect(() => {
    if (phase !== 'playing') return
    const interval = setInterval(() => {
      const newPrice = nextPrice(priceRef.current)
      priceRef.current = newPrice
      tickRef.current++
      const tick = tickRef.current
      setPrices(prev => [...prev, newPrice])
      setCurrentPrice(newPrice)
      setProgress(tick / TOTAL_TICKS)

      if (tick >= TOTAL_TICKS) {
        clearInterval(interval)
        if (sharesRef.current > 0) {
          cashRef.current += sharesRef.current * newPrice
          sharesRef.current = 0
        }
        const fv = Math.round(cashRef.current)
        setFinalValue(fv)
        setCash(fv)
        setShares(0)
        setPhase('done')
      }
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [phase])

  const buy = useCallback(() => {
    if (sharesRef.current > 0) return
    const qty = Math.floor(cashRef.current / priceRef.current)
    if (qty === 0) return
    const spent = qty * priceRef.current
    cashRef.current -= spent
    sharesRef.current = qty
    buyPriceRef.current = priceRef.current
    const trade: Trade = { idx: tickRef.current, type: 'buy', price: priceRef.current }
    tradesRef.current = [...tradesRef.current, trade]
    setTrades([...tradesRef.current])
    setCash(Math.round(cashRef.current))
    setShares(qty)
    showFeedback(`买入 ${qty} 股 @¥${priceRef.current.toFixed(0)}`, true)
  }, [])

  const sell = useCallback(() => {
    if (sharesRef.current === 0) return
    const earned = sharesRef.current * priceRef.current
    const profit = (priceRef.current - buyPriceRef.current) * sharesRef.current
    cashRef.current += earned
    const qty = sharesRef.current
    sharesRef.current = 0
    const trade: Trade = { idx: tickRef.current, type: 'sell', price: priceRef.current }
    tradesRef.current = [...tradesRef.current, trade]
    setTrades([...tradesRef.current])
    setCash(Math.round(cashRef.current))
    setShares(0)
    const sign = profit >= 0 ? '+' : ''
    showFeedback(`卖出 ${qty} 股，${sign}¥${profit.toFixed(0)}`, profit >= 0)
  }, [])

  const header = (
    <div className="flex items-center gap-3 mb-4">
      <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
      <h1 className="text-xl font-bold text-slate-800">炒股票</h1>
    </div>
  )

  if (phase === 'intro') {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
        {header}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <p className="text-slate-700 text-lg font-semibold mb-4">玩法说明</p>
          <div className="space-y-3 text-slate-600 text-base">
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 text-sm">买</span>
              <p>看到价格较低时，点 <b>买入</b> — 用所有现金买入股票</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center flex-shrink-0 text-sm">卖</span>
              <p>看到价格较高时，点 <b>卖出</b> — 卖掉所有股票变现</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0 text-sm">目</span>
              <p>游戏结束时现金越多越好，起始资金 <b>¥{INITIAL_CASH}</b></p>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            priceRef.current = START_PRICE
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
          <p className="text-slate-500 text-base mb-1">交易结束！最终资金</p>
          <p className="text-6xl font-bold text-green-600 mb-1">¥{finalValue}</p>
          <p className={`text-xl font-semibold mb-8 ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {profit >= 0 ? `+¥${profit}` : `-¥${Math.abs(profit)}`} ({profit >= 0 ? '盈利' : '亏损'})
          </p>
          <div className="w-full bg-white rounded-2xl p-4 shadow-sm mb-8">
            <p className="text-slate-400 text-sm mb-2">交易记录</p>
            {trades.length === 0 ? (
              <p className="text-slate-300 text-sm text-center py-2">未进行交易</p>
            ) : trades.map((t, i) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0 text-sm">
                <span className={`font-semibold ${t.type === 'buy' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.type === 'buy' ? '买入' : '卖出'}
                </span>
                <span className="text-slate-500">@¥{t.price.toFixed(0)}</span>
              </div>
            ))}
          </div>
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
  const holdingValue = Math.round(shares * currentPrice)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      {header}

      {/* Progress */}
      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
        <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${progress * 100}%` }}/>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 mb-3">
        <PriceChart prices={prices} trades={trades}/>
      </div>

      {/* Price */}
      <div className="text-center mb-3">
        <p className="text-slate-400 text-sm">当前股价</p>
        <p className="text-4xl font-bold text-slate-800">¥{currentPrice.toFixed(0)}</p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`text-center text-base font-semibold py-2 rounded-xl mb-3 ${
          feedback.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Portfolio */}
      <div className="bg-slate-50 rounded-xl p-3 mb-4 flex justify-between text-sm">
        <div className="text-center">
          <p className="text-slate-400">现金</p>
          <p className="font-bold text-slate-700">¥{cash}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400">持股</p>
          <p className="font-bold text-slate-700">{shares} 股</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400">持仓市值</p>
          <p className="font-bold text-slate-700">{shares > 0 ? `¥${holdingValue}` : '—'}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400">总资产</p>
          <p className={`font-bold ${portfolioValue >= INITIAL_CASH ? 'text-emerald-600' : 'text-red-500'}`}>
            ¥{portfolioValue}
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={buy}
          disabled={shares > 0 || cash < currentPrice}
          className="py-5 rounded-2xl text-white text-xl font-bold bg-emerald-500 shadow-sm active:scale-95 transition-all disabled:opacity-30"
        >
          买入
        </button>
        <button
          onClick={sell}
          disabled={shares === 0}
          className="py-5 rounded-2xl text-white text-xl font-bold bg-red-500 shadow-sm active:scale-95 transition-all disabled:opacity-30"
        >
          卖出
        </button>
      </div>
    </div>
  )
}
