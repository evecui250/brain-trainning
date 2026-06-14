'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { addSession } from '@/lib/storage'

const TOTAL = 20

function shuffle(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i + 1)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function NumbersGame() {
  const router = useRouter()
  const [order] = useState(() => shuffle(TOTAL))
  const [next, setNext] = useState(1)
  const [done, setDone] = useState<Set<number>>(new Set())
  const [wrong, setWrong] = useState<number | null>(null)
  const [finished, setFinished] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function handleTap(num: number) {
    if (done.has(num)) return
    if (num === next) {
      const nextDone = new Set(done)
      nextDone.add(num)
      setDone(nextDone)
      if (num === TOTAL) {
        if (timerRef.current) clearInterval(timerRef.current)
        setFinished(true)
      } else {
        setNext(num + 1)
      }
    } else {
      setWrong(num)
      setTimeout(() => setWrong(null), 600)
    }
  }

  if (finished) {
    const score = Math.max(100 - Math.floor(elapsed / 3), 10)
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 min-h-screen flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
          <h1 className="text-xl font-bold text-slate-800">数字接龙</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-slate-500 text-base mb-2">最终得分</p>
          <p className="text-7xl font-bold text-indigo-600 mb-1">{score}</p>
          <p className="text-slate-400 text-base mb-2">用时 {elapsed} 秒</p>
          <p className="text-slate-400 text-sm mb-8">满分 100 分</p>
          <button
            onClick={() => { addSession('numbers', '数字接龙', score); router.push('/games') }}
            className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl"
          >
            记录并继续
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
          <h1 className="text-xl font-bold text-slate-800">数字接龙</h1>
        </div>
        <span className="text-slate-400 text-sm">{elapsed} 秒</span>
      </div>

      <p className="text-slate-500 text-sm mb-3 text-center">从 1 开始，按顺序点击每个数字</p>

      <div className="flex justify-between text-sm text-slate-400 mb-3 px-1">
        <span>已完成 <b className="text-emerald-600">{done.size}</b> / {TOTAL}</span>
        <span>下一个：<b className="text-indigo-600">{next}</b></span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {order.map(num => {
          const isDone = done.has(num)
          const isWrong = wrong === num
          return (
            <button
              key={num}
              onClick={() => handleTap(num)}
              disabled={isDone}
              className={`h-14 rounded-2xl text-xl font-bold transition-all select-none ${
                isDone
                  ? 'bg-emerald-50 text-emerald-400 opacity-50'
                  : isWrong
                  ? 'bg-red-100 text-red-500 scale-95'
                  : 'bg-white text-slate-800 shadow-sm border border-slate-100 active:scale-95'
              }`}
            >
              {isDone ? '✓' : num}
            </button>
          )
        })}
      </div>
    </div>
  )
}
