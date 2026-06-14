'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
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
    <svg viewBox="0 0 160 160" className="w-48 h-48 mx-auto">
      <circle cx={cx} cy={cy} r={r} fill="white" stroke="#4A90D9" strokeWidth="3" />
      {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, i) => {
        const angle = i * 30 - 90
        const tx = cx + 58 * Math.cos(toRad(angle))
        const ty = cy + 58 * Math.sin(toRad(angle))
        return <text key={n} x={tx} y={ty} textAnchor="middle" dominantBaseline="central" fontSize="14" fill="#333" fontWeight="bold">{n}</text>
      })}
      {/* Hour ticks */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = i * 30 - 90
        const x1 = cx + 65 * Math.cos(toRad(a))
        const y1 = cy + 65 * Math.sin(toRad(a))
        const x2 = cx + 72 * Math.cos(toRad(a))
        const y2 = cy + 72 * Math.sin(toRad(a))
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#999" strokeWidth="2" />
      })}
      {/* Hour hand */}
      <line x1={cx} y1={cy} x2={hourX} y2={hourY} stroke="#1A1A2E" strokeWidth="5" strokeLinecap="round" />
      {/* Minute hand */}
      <line x1={cx} y1={cy} x2={minX} y2={minY} stroke="#4A90D9" strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="4" fill="#333" />
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

  function handleComplete() {
    addSession('clock', '认识时钟', score * 20)
    router.push('/games')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <NavBar />
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push('/games')} className="text-3xl">←</button>
        <h1 className="text-2xl font-bold">🕐 认识时钟</h1>
      </div>
      <p className="text-gray-500 text-lg mb-4">读出时钟显示的时间，选择正确答案</p>

      {!done ? (
        <div>
          <div className="text-center text-gray-500 text-lg mb-4">第 {round + 1} / {ROUNDS} 题</div>
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-5">
            <ClockFace h={correct.h} m={correct.m} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt, i) => {
              const isCorrect = opt.h === correct.h && opt.m === correct.m
              const isSelected = selected?.h === opt.h && selected?.m === opt.m
              let cls = 'bg-white border-2 border-gray-200 text-gray-800'
              if (isSelected && isCorrect) cls = 'bg-green-100 border-2 border-green-500 text-green-700'
              else if (isSelected && !isCorrect) cls = 'bg-red-100 border-2 border-red-400 text-red-700'
              else if (selected && isCorrect) cls = 'bg-green-100 border-2 border-green-500 text-green-700'
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
          <div className="mt-4 text-center text-lg text-gray-500">得分：{score}/{round}</div>
        </div>
      ) : (
        <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-5 text-center">
          <p className="text-4xl mb-2">🎉</p>
          <p className="text-2xl font-bold text-green-700 mb-1">完成！</p>
          <p className="text-xl text-gray-600 mb-4">答对 {score} / {ROUNDS} 题</p>
          <button onClick={handleComplete}
            className="w-full bg-green-500 text-white text-xl font-bold py-4 rounded-xl">
            记录并继续 →
          </button>
        </div>
      )}
    </div>
  )
}
