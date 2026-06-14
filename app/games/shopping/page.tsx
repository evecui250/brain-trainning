'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addSession } from '@/lib/storage'

const ALL_ITEMS = [
  '苹果','香蕉','鸡蛋','牛奶','面包','白菜','胡萝卜','豆腐',
  '猪肉','鱼','西红柿','土豆','橙子','葡萄','饼干','酱油',
  '花生','大米','洗衣液','饮料','大蒜','姜','醋','芹菜',
]

const ROUNDS = 4
const TARGET_COUNT = 5
const GRID_SIZE = 12
const SHOW_SECONDS = 6

type Phase = 'memorize' | 'pick' | 'result'

type Round = {
  targets: string[]
  grid: string[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeRound(): Round {
  const shuffled = shuffle(ALL_ITEMS)
  const targets = shuffled.slice(0, TARGET_COUNT)
  const distractors = shuffled.slice(TARGET_COUNT, TARGET_COUNT + (GRID_SIZE - TARGET_COUNT))
  const grid = shuffle([...targets, ...distractors])
  return { targets, grid }
}

export default function ShoppingGame() {
  const router = useRouter()
  const [rounds] = useState<Round[]>(() => Array.from({ length: ROUNDS }, makeRound))
  const [roundIdx, setRoundIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('memorize')
  const [countdown, setCountdown] = useState(SHOW_SECONDS)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [roundScores, setRoundScores] = useState<number[]>([])
  const [allDone, setAllDone] = useState(false)

  const round = rounds[roundIdx]

  useEffect(() => {
    if (phase !== 'memorize') return
    setCountdown(SHOW_SECONDS)
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval)
          setPhase('pick')
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, roundIdx])

  const toggleItem = useCallback((item: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(item)) {
        next.delete(item)
      } else if (next.size < TARGET_COUNT) {
        next.add(item)
      }
      return next
    })
  }, [])

  function submitRound() {
    const hits = round.targets.filter(t => selected.has(t)).length
    const score = Math.round((hits / TARGET_COUNT) * 100)
    const newScores = [...roundScores, score]
    setRoundScores(newScores)
    setPhase('result')
  }

  function nextRound() {
    if (roundIdx + 1 >= ROUNDS) {
      setAllDone(true)
    } else {
      setRoundIdx(r => r + 1)
      setSelected(new Set())
      setPhase('memorize')
    }
  }

  const header = (
    <div className="flex items-center gap-3 mb-6">
      <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
      <h1 className="text-xl font-bold text-slate-800">购物清单</h1>
      <span className="ml-auto text-sm text-slate-400">第 {roundIdx + 1}/{ROUNDS} 轮</span>
    </div>
  )

  if (allDone) {
    const avg = Math.round(roundScores.reduce((a, b) => a + b, 0) / roundScores.length)
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 min-h-screen flex flex-col">
        {header}
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-slate-500 text-base mb-2">全部完成！平均得分</p>
          <p className="text-7xl font-bold text-teal-500 mb-1">{avg}</p>
          <p className="text-slate-400 text-xl mb-6">分</p>
          <div className="w-full bg-white rounded-2xl p-4 shadow-sm mb-8">
            {roundScores.map((s, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-slate-500">第 {i + 1} 轮</span>
                <span className="font-semibold text-teal-600">{s} 分</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => { addSession('shopping', '购物清单', avg); router.push('/games') }}
            className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl"
          >
            记录并继续
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'memorize') {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
        {header}
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-teal-700 font-semibold text-base">记住这 {TARGET_COUNT} 件商品</p>
            <span className="text-2xl font-bold text-teal-600">{countdown}s</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {round.targets.map(item => (
              <div key={item} className="bg-white rounded-xl py-3 text-center text-base font-semibold text-teal-700 shadow-sm border border-teal-100">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="w-full bg-teal-100 rounded-full h-2">
          <div
            className="bg-teal-500 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${(countdown / SHOW_SECONDS) * 100}%` }}
          />
        </div>
        <p className="text-center text-sm text-slate-400 mt-3">时间到后请从下方选出这些商品</p>
      </div>
    )
  }

  if (phase === 'pick') {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
        {header}
        <p className="text-slate-500 text-sm text-center mb-4">
          请选出刚才清单上的 <span className="font-semibold text-teal-600">{TARGET_COUNT}</span> 件商品
          （已选 {selected.size}/{TARGET_COUNT}）
        </p>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {round.grid.map(item => {
            const isSel = selected.has(item)
            return (
              <button
                key={item}
                onClick={() => toggleItem(item)}
                className={`py-3 rounded-xl text-base font-semibold transition-all active:scale-95 ${
                  isSel
                    ? 'bg-teal-500 text-white shadow-md scale-105'
                    : 'bg-white text-slate-700 border border-slate-200 shadow-sm'
                }`}
              >
                {item}
              </button>
            )
          })}
        </div>
        <button
          onClick={submitRound}
          disabled={selected.size === 0}
          className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl disabled:opacity-30"
        >
          确认选择
        </button>
      </div>
    )
  }

  // phase === 'result'
  const hits = round.targets.filter(t => selected.has(t))
  const misses = round.targets.filter(t => !selected.has(t))
  const falseAlarms = [...selected].filter(s => !round.targets.includes(s))
  const roundScore = roundScores[roundScores.length - 1]

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      {header}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <div className="text-center mb-4">
          <p className="text-slate-400 text-sm">本轮得分</p>
          <p className="text-5xl font-bold text-teal-500">{roundScore}</p>
          <p className="text-slate-400">分</p>
        </div>
        {hits.length > 0 && (
          <div className="mb-3">
            <p className="text-emerald-600 text-sm font-semibold mb-1">答对 ({hits.length})</p>
            <div className="flex flex-wrap gap-2">
              {hits.map(i => <span key={i} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-sm font-medium border border-emerald-200">{i}</span>)}
            </div>
          </div>
        )}
        {misses.length > 0 && (
          <div className="mb-3">
            <p className="text-amber-600 text-sm font-semibold mb-1">漏选 ({misses.length})</p>
            <div className="flex flex-wrap gap-2">
              {misses.map(i => <span key={i} className="bg-amber-50 text-amber-700 px-3 py-1 rounded-lg text-sm font-medium border border-amber-200">{i}</span>)}
            </div>
          </div>
        )}
        {falseAlarms.length > 0 && (
          <div>
            <p className="text-red-500 text-sm font-semibold mb-1">多选 ({falseAlarms.length})</p>
            <div className="flex flex-wrap gap-2">
              {falseAlarms.map(i => <span key={i} className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-sm font-medium border border-red-200">{i}</span>)}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={nextRound}
        className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl"
      >
        {roundIdx + 1 < ROUNDS ? '下一轮' : '查看结果'}
      </button>
    </div>
  )
}
