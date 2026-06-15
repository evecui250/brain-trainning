'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addSession } from '@/lib/storage'

const ROUNDS = 3
const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444']
const COLOR_NAMES = ['蓝', '绿', '橙', '红']

type Difficulty = { grid: number; litCount: number; showSeconds: number }
const LEVELS: Difficulty[] = [
  { grid: 3, litCount: 3, showSeconds: 6 },
  { grid: 3, litCount: 4, showSeconds: 6 },
  { grid: 4, litCount: 5, showSeconds: 8 },
]

function makePattern(level: Difficulty): number[] {
  const cells = level.grid * level.grid
  const indices = new Set<number>()
  while (indices.size < level.litCount) {
    indices.add(Math.floor(Math.random() * cells))
  }
  return Array.from({ length: cells }, (_, i) =>
    indices.has(i) ? Math.floor(Math.random() * COLORS.length) : -1
  )
}

type Phase = 'show' | 'input' | 'result'

export default function PatternGame() {
  const router = useRouter()
  const [round, setRound] = useState(0)
  const [level] = useState(() => LEVELS)
  const [pattern, setPattern] = useState(() => makePattern(LEVELS[0]))
  const [phase, setPhase] = useState<Phase>('show')
  const [input, setInput] = useState<number[]>(() => Array(LEVELS[0].grid * LEVELS[0].grid).fill(-1))
  const [score, setScore] = useState(0)
  const [totalDone, setTotalDone] = useState(false)
  const [countdown, setCountdown] = useState(LEVELS[0].showSeconds)
  const [selectedColor, setSelectedColor] = useState(0)
  const [lastResult, setLastResult] = useState<'pass' | 'fail' | null>(null)

  const currentLevel = level[Math.min(round, LEVELS.length - 1)]

  useEffect(() => {
    if (phase !== 'show') return
    setCountdown(currentLevel.showSeconds)
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(id)
          setPhase('input')
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase, round, currentLevel.showSeconds])

  const toggleCell = useCallback((i: number) => {
    if (phase !== 'input') return
    setInput(prev => {
      const next = [...prev]
      next[i] = next[i] === selectedColor ? -1 : selectedColor
      return next
    })
  }, [phase, selectedColor])

  function check() {
    let correct = 0
    let litCount = 0
    pattern.forEach((p, i) => {
      if (p >= 0) { litCount++; if (p === input[i]) correct++ }
    })
    const pass = litCount > 0 && correct / litCount >= 0.75
    if (pass) setScore(s => s + 1)
    setLastResult(pass ? 'pass' : 'fail')
    setPhase('result')
  }

  function nextRound() {
    const next = round + 1
    if (next >= ROUNDS) {
      setTotalDone(true)
    } else {
      const nextLevel = LEVELS[Math.min(next, LEVELS.length - 1)]
      setRound(next)
      setPattern(makePattern(nextLevel))
      setInput(Array(nextLevel.grid * nextLevel.grid).fill(-1))
      setLastResult(null)
      setPhase('show')
    }
  }

  if (totalDone) {
    const finalScore = Math.round((score / ROUNDS) * 100)
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 min-h-screen flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
          <h1 className="text-xl font-bold text-slate-800">图案记忆</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-slate-500 text-base mb-2">最终得分</p>
          <p className="text-7xl font-bold text-indigo-600 mb-1">{finalScore}</p>
          <p className="text-slate-400 text-base mb-2">通过 {score} / {ROUNDS} 轮</p>
          <p className="text-slate-400 text-sm mb-8">满分 100 分</p>
          <button
            onClick={() => { addSession('pattern', '图案记忆', finalScore); router.push('/games') }}
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
          <h1 className="text-xl font-bold text-slate-800">图案记忆</h1>
        </div>
        <span className="text-slate-400 text-sm">第 {round + 1}/{ROUNDS} 轮</span>
      </div>

      {phase === 'show' && (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center text-amber-700 font-semibold mb-4">
            记住图案 — {countdown} 秒后隐藏
          </div>
          <div className="flex justify-center">
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${currentLevel.grid}, 1fr)`, maxWidth: currentLevel.grid === 3 ? 240 : 300 }}>
              {pattern.map((c, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl shadow-sm"
                  style={{ background: c >= 0 ? COLORS[c] : '#f1f5f9', width: currentLevel.grid === 3 ? 72 : 66 }}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {phase === 'input' && (
        <>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center text-indigo-700 font-semibold mb-4">
            复现图案 — 点击格子涂色
          </div>

          <div className="flex gap-2 mb-4 justify-center">
            {COLORS.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelectedColor(i)}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className={`w-11 h-11 rounded-full border-4 transition-all ${selectedColor === i ? 'border-slate-700 scale-110 shadow-md' : 'border-transparent'}`}
                  style={{ background: c }}
                />
                <span className="text-xs text-slate-500">{COLOR_NAMES[i]}</span>
              </button>
            ))}
            <button onClick={() => setSelectedColor(-2)} className="flex flex-col items-center gap-1">
              <div className={`w-11 h-11 rounded-full border-4 bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-bold ${selectedColor === -2 ? 'border-slate-700 scale-110' : 'border-transparent'}`}>
                ✕
              </div>
              <span className="text-xs text-slate-500">清除</span>
            </button>
          </div>

          <div className="flex justify-center mb-4">
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${currentLevel.grid}, 1fr)`, maxWidth: currentLevel.grid === 3 ? 240 : 300 }}>
              {input.map((c, i) => (
                <button
                  key={i}
                  onClick={() => toggleCell(i)}
                  className="aspect-square rounded-xl border-2 border-slate-200 shadow-sm transition-all"
                  style={{ background: c >= 0 ? COLORS[c] : '#f8fafc', width: currentLevel.grid === 3 ? 72 : 66 }}
                />
              ))}
            </div>
          </div>

          <button onClick={check} className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl">
            提交答案
          </button>
        </>
      )}

      {phase === 'result' && !totalDone && (
        <>
          <div className={`rounded-xl p-3 mb-4 text-center font-semibold ${lastResult === 'pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
            {lastResult === 'pass' ? '答对了' : '加油'}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-center text-slate-400 text-sm mb-2">原图</p>
              <div className="grid gap-2 mx-auto" style={{ gridTemplateColumns: `repeat(${currentLevel.grid}, 1fr)` }}>
                {pattern.map((c, i) => (
                  <div key={i} className="aspect-square rounded-lg" style={{ background: c >= 0 ? COLORS[c] : '#e2e8f0' }} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-center text-slate-400 text-sm mb-2">你的答案</p>
              <div className="grid gap-2 mx-auto" style={{ gridTemplateColumns: `repeat(${currentLevel.grid}, 1fr)` }}>
                {input.map((c, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg border-2 ${c === pattern[i] ? 'border-emerald-400' : 'border-red-300'}`}
                    style={{ background: c >= 0 ? COLORS[c] : '#f1f5f9' }}
                  />
                ))}
              </div>
            </div>
          </div>
          <button onClick={nextRound} className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl">
            {round + 1 < ROUNDS ? '下一轮' : '查看结果'}
          </button>
        </>
      )}
    </div>
  )
}
