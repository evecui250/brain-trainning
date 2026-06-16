'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addSession } from '@/lib/storage'

const ROUNDS = 5
const MEMORIZE_SECS = 3
const GRID_SIZE = 36

type HSL = [number, number, number]

function hsl([h, s, l]: HSL) {
  return `hsl(${h},${s}%,${l}%)`
}

function hueDist(a: number, b: number): number {
  const d = Math.abs(a - b)
  return Math.min(d, 360 - d)
}

function colorScore(target: HSL, picked: HSL): number {
  const hd = hueDist(target[0], picked[0])
  const sd = Math.abs(target[1] - picked[1])
  const ld = Math.abs(target[2] - picked[2])
  return Math.max(0, Math.round(100 - hd * 0.9 - sd * 0.25 - ld * 0.25))
}

function randColor(): HSL {
  return [
    Math.floor(Math.random() * 360),
    55 + Math.floor(Math.random() * 25),
    40 + Math.floor(Math.random() * 20),
  ]
}

function buildGrid(target: HSL): HSL[] {
  const all: HSL[] = []
  // 11 similar colors near the target hue (the confusables)
  for (let i = 1; i <= 11; i++) {
    const sign = i % 2 === 0 ? 1 : -1
    all.push([
      Math.round(((target[0] + sign * i * 8) + 360) % 360),
      Math.min(85, Math.max(48, target[1] + (Math.random() * 14 - 7))),
      Math.min(65, Math.max(35, target[2] + (Math.random() * 12 - 6))),
    ] as HSL)
  }
  // 24 colors spread evenly across the full hue spectrum
  for (let i = 0; i < 24; i++) {
    const hue = Math.round((i * (360 / 24) + Math.random() * 8) % 360)
    all.push([hue, 55 + Math.round(Math.random() * 25), 40 + Math.round(Math.random() * 20)])
  }
  // Take 35, add target, sort by hue for gradient display
  const picked = all.sort(() => Math.random() - 0.5).slice(0, GRID_SIZE - 1)
  picked.push(target)
  picked.sort((a, b) => a[0] - b[0])
  return picked.slice(0, GRID_SIZE)
}

type Phase = 'memorize' | 'pick' | 'result'

export default function ColorGame() {
  const router = useRouter()
  const [targets] = useState<HSL[]>(() => Array.from({ length: ROUNDS }, randColor))
  const [round, setRound] = useState(0)
  const [grid, setGrid] = useState<HSL[]>([])
  const [phase, setPhase] = useState<Phase>('memorize')
  const [countdown, setCountdown] = useState(MEMORIZE_SECS)
  const [picked, setPicked] = useState<HSL | null>(null)
  const [lastScore, setLastScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [done, setDone] = useState(false)

  const target = targets[round]

  useEffect(() => {
    setGrid(buildGrid(target))
    setPhase('memorize')
    setCountdown(MEMORIZE_SECS)
    setPicked(null)
  }, [round])

  useEffect(() => {
    if (phase !== 'memorize') return
    if (countdown <= 0) { setPhase('pick'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown])

  function pick(c: HSL) {
    if (phase !== 'pick') return
    const s = colorScore(target, c)
    setPicked(c)
    setLastScore(s)
    setTotal(t => t + s)
    setPhase('result')
  }

  function next() {
    if (round + 1 >= ROUNDS) setDone(true)
    else setRound(r => r + 1)
  }

  const avg = Math.round(total / (done ? ROUNDS : Math.max(round, 1)))

  if (done) {
    const finalAvg = Math.round(total / ROUNDS)
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 min-h-screen flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
          <h1 className="text-xl font-bold text-slate-800">颜色记忆</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-slate-500 text-base mb-2">平均得分</p>
          <p className="text-7xl font-bold text-indigo-600 mb-1">{finalAvg}</p>
          <p className="text-slate-400 text-base mb-8">满分 100 分</p>
          <button
            onClick={() => { addSession('color', '颜色记忆', finalAvg); router.push('/games') }}
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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
          <h1 className="text-xl font-bold text-slate-800">颜色记忆</h1>
        </div>
        <span className="text-slate-400 text-sm">{round + 1}/{ROUNDS}</span>
      </div>

      {phase === 'memorize' && (
        <div className="text-center">
          <p className="text-slate-500 mb-4">记住这个颜色</p>
          <div className="rounded-2xl mx-auto mb-6 shadow-sm" style={{ background: hsl(target), height: 160 }} />
          <p className="text-6xl font-bold text-slate-300">{countdown}</p>
        </div>
      )}

      {phase === 'pick' && (
        <>
          <p className="text-slate-500 text-center mb-4">找出刚才的颜色</p>
          <div className="grid grid-cols-6 gap-1.5">
            {grid.map((c, i) => (
              <button
                key={i}
                onClick={() => pick(c)}
                className="rounded-lg aspect-square active:scale-90 transition-transform"
                style={{ background: hsl(c) }}
              />
            ))}
          </div>
        </>
      )}

      {phase === 'result' && picked && (
        <div className="text-center">
          <p className="text-slate-500 mb-5">对比结果</p>
          <div className="flex items-center justify-center gap-6 mb-5">
            <div>
              <div className="w-20 h-20 rounded-xl mx-auto mb-2 shadow-sm" style={{ background: hsl(target) }} />
              <p className="text-slate-400 text-sm">目标</p>
            </div>
            <p className="text-slate-300 text-2xl">vs</p>
            <div>
              <div className="w-20 h-20 rounded-xl mx-auto mb-2 shadow-sm" style={{ background: hsl(picked) }} />
              <p className="text-slate-400 text-sm">你选的</p>
            </div>
          </div>
          <p className={`text-5xl font-bold mb-6 ${lastScore >= 80 ? 'text-emerald-500' : lastScore >= 50 ? 'text-amber-500' : 'text-rose-400'}`}>
            {lastScore}<span className="text-2xl text-slate-300 ml-1">分</span>
          </p>
          <button onClick={next} className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl">
            {round + 1 >= ROUNDS ? '查看结果' : '下一轮'}
          </button>
        </div>
      )}
    </div>
  )
}
