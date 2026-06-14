'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addSession } from '@/lib/storage'

const ROUNDS = 5

function randTime() {
  const h = Math.floor(Math.random() * 12)
  const m = [0, 15, 30, 45][Math.floor(Math.random() * 4)]
  return { h, m }
}

function timeLabel(h: number, m: number) {
  const hh = h === 0 ? 12 : h
  return `${hh}:${m.toString().padStart(2, '0')}`
}

function shuffle<T>(a: T[]): T[] {
  const arr = [...a]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function makeRound() {
  const correct = randTime()
  const options = [correct]
  while (options.length < 4) {
    const t = randTime()
    if (!options.some(o => o.h === t.h && o.m === t.m)) options.push(t)
  }
  return { correct, options: shuffle(options) }
}

function ClockFace({ h, m }: { h: number; m: number }) {
  const cx = 80, cy = 80, r = 72
  const hourAngle = ((h % 12) + m / 60) * 30 - 90
  const minAngle = m * 6 - 90
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const hourX = cx + 45 * Math.cos(toRad(hourAngle))
  const hourY = cy + 45 * Math.sin(toRad(hourAngle))
  const minX = cx + 60 * Math.cos(toRad(minAngle))
  const minY = cy + 60 * Math.sin(toRad(minAngle))

  return (
    <svg viewBox="0 0 160 160" className="w-44 h-44 mx-auto">
      <circle cx={cx} cy={cy} r={r} fill="white" stroke="#e2e8f0" strokeWidth="2.5" />
      {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, i) => {
        const angle = i * 30 - 90
        const tx = cx + 58 * Math.cos(toRad(angle))
        const ty = cy + 58 * Math.sin(toRad(angle))
        return <text key={n} x={tx} y={ty} textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#475569" fontWeight={n % 3 === 0 ? '600' : '400'}>{n}</text>
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const a = i * 30 - 90
        const x1 = cx + 65 * Math.cos(toRad(a))
        const y1 = cy + 65 * Math.sin(toRad(a))
        const x2 = cx + 72 * Math.cos(toRad(a))
        const y2 = cy + 72 * Math.sin(toRad(a))
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="1.5" />
      })}
      <line x1={cx} y1={cy} x2={hourX} y2={hourY} stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={minX} y2={minY} stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="4" fill="#334155" />
    </svg>
  )
}

export default function ClockGame() {
  const router = useRouter()
  const [round, setRound] = useState(0)
  const [{ correct, options }, setRound_] = useState(makeRound)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<{ h: number; m: number } | null>(null)
  const [done, setDone] = useState(false)

  const handleSelect = useCallback((opt: { h: number; m: number }) => {
    if (selected) return
    setSelected(opt)
    if (opt.h === correct.h && opt.m === correct.m) setScore(s => s + 1)
    setTimeout(() => {
      const nextRound = round + 1
      if (nextRound >= ROUNDS) {
        setDone(true)
      } else {
        setRound(nextRound)
        setRound_(makeRound())
        setSelected(null)
      }
    }, 1200)
  }, [selected, correct, round])

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 min-h-screen flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
          <h1 className="text-xl font-bold text-slate-800">认识时钟</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-slate-500 text-base mb-2">最终得分</p>
          <p className="text-7xl font-bold text-indigo-600 mb-1">{score * 20}</p>
          <p className="text-slate-400 text-base mb-2">答对 {score} / {ROUNDS} 题</p>
          <p className="text-slate-400 text-sm mb-8">满分 100 分</p>
          <button
            onClick={() => { addSession('clock', '认识时钟', score * 20); router.push('/games') }}
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
          <h1 className="text-xl font-bold text-slate-800">认识时钟</h1>
        </div>
        <span className="text-slate-400 text-sm">{round + 1}/{ROUNDS}</span>
      </div>

      <p className="text-slate-500 text-sm mb-4 text-center">读出时钟显示的时间，选择正确答案</p>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-5">
        <ClockFace h={correct.h} m={correct.m} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const isCorrect = opt.h === correct.h && opt.m === correct.m
          const isSelected = selected?.h === opt.h && selected?.m === opt.m
          let cls = 'bg-white border-2 border-slate-200 text-slate-800 shadow-sm'
          if (isSelected && isCorrect) cls = 'bg-emerald-50 border-2 border-emerald-400 text-emerald-700'
          else if (isSelected && !isCorrect) cls = 'bg-red-50 border-2 border-red-300 text-red-600'
          else if (selected && isCorrect) cls = 'bg-emerald-50 border-2 border-emerald-400 text-emerald-700'
          return (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              className={`py-4 rounded-xl text-2xl font-bold transition-all ${cls}`}
            >
              {timeLabel(opt.h, opt.m)}
            </button>
          )
        })}
      </div>

      <div className="mt-4 text-center text-sm text-slate-400">得分：{score}/{round}</div>
    </div>
  )
}
