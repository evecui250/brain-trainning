'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'

const ROUNDS = 10

type Problem = { a: number; b: number; op: '+' | '-'; answer: number }
type State = 'waiting' | 'correct' | 'wrong'

function makeProblem(level: number): Problem {
  const max = 10 + level * 5
  let a = Math.floor(Math.random() * max) + 1
  let b = Math.floor(Math.random() * max) + 1
  // Alternate between + and -, ensure no negative answers
  const useAdd = Math.random() > 0.5
  const op: '+' | '-' = useAdd ? '+' : '-'
  if (op === '-') {
    if (a < b) [a, b] = [b, a]
    if (a === b) a += 1
  }
  const answer = op === '+' ? a + b : a - b
  return { a, b, op, answer }
}

export default function MathGame() {
  const router = useRouter()
  const problems = useMemo(
    () => Array.from({ length: ROUNDS }, (_, i) => makeProblem(Math.floor(i / 4))),
    []
  )
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [input, setInput] = useState('')
  const [state, setState] = useState<State>('waiting')
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  const p = problems[idx]

  const pressKey = useCallback((key: string) => {
    if (state !== 'waiting') return
    if (key === '⌫') {
      setInput(prev => prev.slice(0, -1))
    } else {
      if (input.length >= 4) return
      setInput(prev => prev + key)
    }
  }, [state, input])

  const submit = useCallback(() => {
    if (state !== 'waiting' || input === '') return
    const userAnswer = parseInt(input, 10)
    const correct = userAnswer === p.answer
    if (correct) setScore(s => s + 1)
    setState(correct ? 'correct' : 'wrong')
    setTimeout(() => {
      const nextIdx = idx + 1
      if (nextIdx >= ROUNDS) {
        setDone(true)
      } else {
        setIdx(nextIdx)
        setInput('')
        setState('waiting')
      }
    }, 1200)
  }, [state, input, p.answer, idx])

  async function handleComplete() {
    setSaving(true)
    await fetch('/api/games/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameType: 'math', gameName: '简单计算', score: score * 10 }),
    })
    router.push('/games')
  }

  const inputColor = state === 'correct'
    ? 'bg-green-100 border-green-500 text-green-700'
    : state === 'wrong'
    ? 'bg-red-100 border-red-400 text-red-700'
    : 'bg-white border-gray-300 text-gray-800'

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <NavBar />
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push('/games')} className="text-3xl">←</button>
        <h1 className="text-2xl font-bold">➕ 简单计算</h1>
      </div>
      <p className="text-gray-500 text-lg mb-4">计算结果，用键盘输入答案</p>

      {!done ? (
        <div>
          {/* Progress */}
          <div className="flex justify-between text-lg font-semibold mb-4 bg-white rounded-xl p-3 shadow-sm">
            <span>第 {idx + 1} / {ROUNDS} 题</span>
            <span>得分：<b className="text-blue-600">{score}</b></span>
          </div>

          {/* Problem */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-4 text-center">
            <p className="text-5xl font-bold text-gray-800 tracking-widest">
              {p.a} {p.op} {p.b} =
            </p>
          </div>

          {/* Answer display */}
          <div className={`border-2 rounded-2xl p-4 mb-4 text-center text-4xl font-bold min-h-[72px] transition-all ${inputColor}`}>
            {state === 'correct' && '✅ 答对了！'}
            {state === 'wrong' && `❌ 正确答案：${p.answer}`}
            {state === 'waiting' && (input || <span className="text-gray-300">?</span>)}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '⌫', ''].map((k, i) => (
              k === '' ? (
                <div key={i} />
              ) : (
                <button
                  key={k}
                  onClick={() => pressKey(k)}
                  disabled={state !== 'waiting'}
                  className={`py-5 rounded-2xl text-2xl font-bold shadow-sm transition-all active:scale-95 ${
                    k === '⌫'
                      ? 'bg-gray-200 text-gray-700'
                      : 'bg-white text-gray-800 border border-gray-200'
                  } disabled:opacity-40`}
                >
                  {k}
                </button>
              )
            ))}
          </div>

          <button
            onClick={submit}
            disabled={state !== 'waiting' || input === ''}
            className="w-full bg-blue-500 text-white text-xl font-bold py-5 rounded-2xl disabled:opacity-40 transition-all active:scale-98"
          >
            确认答案 ✓
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-5 text-center">
          <p className="text-5xl mb-2">🎉</p>
          <p className="text-2xl font-bold text-green-700 mb-1">完成！</p>
          <p className="text-xl text-gray-600 mb-4">答对 {score} / {ROUNDS} 题</p>
          <button onClick={handleComplete} disabled={saving}
            className="w-full bg-green-500 text-white text-xl font-bold py-4 rounded-xl">
            {saving ? '保存中...' : '记录并继续 →'}
          </button>
        </div>
      )}
    </div>
  )
}
