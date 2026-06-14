'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'

const ROUNDS = 3
const COLORS = ['#4A90D9', '#52C41A', '#FA8C16', '#F5222D']
const COLOR_NAMES = ['蓝色', '绿色', '橙色', '红色']

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
  const [saving, setSaving] = useState(false)
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
      if (next[i] === selectedColor) {
        next[i] = -1
      } else {
        next[i] = selectedColor
      }
      return next
    })
  }, [phase, selectedColor])

  function check() {
    let correct = 0
    const total = currentLevel.grid * currentLevel.grid
    pattern.forEach((p, i) => { if (p === input[i]) correct++ })
    const pct = correct / total
    const pass = pct >= 0.75
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

  async function handleComplete() {
    setSaving(true)
    await fetch('/api/games/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameType: 'pattern', gameName: '图案记忆', score: Math.round((score / ROUNDS) * 100) }),
    })
    router.push('/games')
  }

  const gridCols = currentLevel.grid === 3 ? 'grid-cols-3' : 'grid-cols-4'

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <NavBar />
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push('/games')} className="text-3xl">←</button>
        <h1 className="text-2xl font-bold">🎨 图案记忆</h1>
      </div>
      <p className="text-gray-500 text-lg mb-2">记住彩色格子的位置和颜色，然后复现它！</p>
      <div className="text-lg font-semibold mb-4">
        第 {round + 1} / {ROUNDS} 轮 · 得分：{score}/{round}
      </div>

      {phase === 'show' && (
        <div>
          <div className="bg-yellow-100 rounded-xl p-3 text-center text-xl font-bold text-yellow-700 mb-4">
            👀 记住图案！{countdown} 秒后隐藏
          </div>
          <div className={`grid gap-3 mx-auto max-w-xs`} style={{ gridTemplateColumns: `repeat(${currentLevel.grid}, 1fr)` }}>
            {pattern.map((c, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl shadow-sm"
                style={{ background: c >= 0 ? COLORS[c] : '#E5E7EB' }}
              />
            ))}
          </div>
        </div>
      )}

      {phase === 'input' && (
        <div>
          <div className="bg-blue-100 rounded-xl p-3 text-center text-xl font-bold text-blue-700 mb-4">
            ✏️ 现在复现图案！点击格子涂色
          </div>

          {/* Color picker */}
          <div className="flex gap-3 mb-4 justify-center">
            {COLORS.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelectedColor(i)}
                className={`flex flex-col items-center gap-1 transition-all`}
              >
                <div
                  className={`w-12 h-12 rounded-full border-4 transition-all ${selectedColor === i ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent'}`}
                  style={{ background: c }}
                />
                <span className="text-xs text-gray-600">{COLOR_NAMES[i]}</span>
              </button>
            ))}
            <button
              onClick={() => setSelectedColor(-2)}
              className="flex flex-col items-center gap-1"
            >
              <div className={`w-12 h-12 rounded-full border-4 bg-gray-200 flex items-center justify-center text-gray-500 font-bold ${selectedColor === -2 ? 'border-gray-800 scale-110' : 'border-transparent'}`}>
                ✕
              </div>
              <span className="text-xs text-gray-600">清除</span>
            </button>
          </div>

          <div className={`grid gap-3 mx-auto max-w-xs mb-5`} style={{ gridTemplateColumns: `repeat(${currentLevel.grid}, 1fr)` }}>
            {input.map((c, i) => (
              <button
                key={i}
                onClick={() => toggleCell(i)}
                className="aspect-square rounded-xl border-2 border-gray-200 transition-all shadow-sm"
                style={{ background: c >= 0 ? COLORS[c] : '#F9FAFB' }}
              />
            ))}
          </div>

          <button
            onClick={check}
            className="w-full bg-blue-500 text-white text-xl font-bold py-4 rounded-xl"
          >
            提交答案 ✓
          </button>
        </div>
      )}

      {phase === 'result' && !totalDone && (
        <div>
          <div className={`rounded-2xl p-4 mb-4 text-center ${lastResult === 'pass' ? 'bg-green-100' : 'bg-orange-100'}`}>
            <p className="text-3xl mb-1">{lastResult === 'pass' ? '🎉 答对了！' : '💪 加油！'}</p>
          </div>
          <p className="text-xl font-bold text-center mb-4 text-gray-700">对比结果</p>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-center text-gray-500 mb-2">原图</p>
              <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${currentLevel.grid}, 1fr)` }}>
                {pattern.map((c, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg"
                    style={{ background: c >= 0 ? COLORS[c] : '#E5E7EB' }}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-center text-gray-500 mb-2">你的答案</p>
              <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${currentLevel.grid}, 1fr)` }}>
                {input.map((c, i) => {
                  const ok = c === pattern[i]
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-lg border-2 ${ok ? 'border-green-400' : 'border-red-400'}`}
                      style={{ background: c >= 0 ? COLORS[c] : '#F3F4F6' }}
                    />
                  )
                })}
              </div>
            </div>
          </div>
          <button onClick={nextRound} className="w-full bg-blue-500 text-white text-xl font-bold py-4 rounded-xl">
            {round + 1 < ROUNDS ? '下一轮 →' : '查看结果'}
          </button>
        </div>
      )}

      {totalDone && (
        <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-5 text-center">
          <p className="text-5xl mb-2">🎉</p>
          <p className="text-2xl font-bold text-green-700 mb-1">全部完成！</p>
          <p className="text-xl text-gray-600 mb-4">通过 {score} / {ROUNDS} 轮</p>
          <button onClick={handleComplete} disabled={saving}
            className="w-full bg-green-500 text-white text-xl font-bold py-4 rounded-xl">
            {saving ? '保存中...' : '记录并继续 →'}
          </button>
        </div>
      )}
    </div>
  )
}
