'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addSession } from '@/lib/storage'

const ROUNDS = 10

type Problem = { a: number; b: number; op: '+' | '-'; answer: number }
type State = 'waiting' | 'correct' | 'wrong'

function makeProblem(level: number): Problem {
  const ranges: [number, number][] = [[2, 12], [10, 40], [15, 60], [25, 99]]
  const [min, max] = ranges[Math.min(level, 3)]
  const rand = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo
  let a = rand(min, max)
  let b = rand(min, max)
  const op: '+' | '-' = Math.random() > 0.5 ? '+' : '-'
  if (op === '-') {
    if (a < b) [a, b] = [b, a]
    if (a === b) a += rand(1, 10)
  }
  const answer = op === '+' ? a + b : a - b
  return { a, b, op, answer }
}

export default function MathGame() {
  const router = useRouter()
  const problems = useMemo(
    () => Array.from({ length: ROUNDS }, (_, i) => makeProblem(Math.floor(i / 3))),
    []
  )
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [input, setInput] = useState('')
  const [state, setState] = useState<State>('waiting')
  const [done, setDone] = useState(false)

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

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 min-h-screen flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
          <h1 className="text-xl font-bold text-slate-800">简单计算</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-slate-500 text-base mb-2">最终得分</p>
          <p className="text-7xl font-bold text-indigo-600 mb-1">{score * 10}</p>
          <p className="text-slate-400 text-base mb-2">答对 {score} / {ROUNDS} 题</p>
          <p className="text-slate-400 text-sm mb-8">满分 100 分</p>
          <button
            onClick={() => { addSession('math', '简单计算', score * 10); router.push('/games') }}
            className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl"
          >
            记录并继续
          </button>
        </div>
      </div>
    )
  }

  const inputColor = state === 'correct'
    ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
    : state === 'wrong'
    ? 'bg-red-50 border-red-300 text-red-600'
    : 'bg-white border-slate-200 text-slate-800'

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
          <h1 className="text-xl font-bold text-slate-800">简单计算</h1>
        </div>
        <span className="text-indigo-600 font-bold text-sm">{idx + 1}/{ROUNDS}</span>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-4 text-center">
        <p className="text-slate-400 text-sm mb-2">计算下面的算式</p>
        <p className="text-5xl font-bold text-slate-800 tracking-widest">
          {p.a} {p.op} {p.b} =
        </p>
      </div>

      <div className={`border-2 rounded-2xl p-4 mb-4 text-center text-4xl font-bold min-h-[68px] transition-all ${inputColor}`}>
        {state === 'correct' && '答对了'}
        {state === 'wrong' && `正确：${p.answer}`}
        {state === 'waiting' && (input || <span className="text-slate-200">?</span>)}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '⌫', '✓'] as const).map((k, i) => {
          if (k === '✓') {
            return (
              <button
                key="confirm"
                onClick={submit}
                disabled={state !== 'waiting' || input === ''}
                className="py-5 rounded-2xl text-2xl font-bold bg-indigo-600 text-white shadow-sm transition-all active:scale-95 disabled:opacity-30"
              >
                ✓
              </button>
            )
          }
          return (
            <button
              key={k}
              onClick={() => pressKey(k)}
              disabled={state !== 'waiting'}
              className={`py-5 rounded-2xl text-2xl font-bold shadow-sm transition-all active:scale-95 ${
                k === '⌫'
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-white text-slate-800 border border-slate-200'
              } disabled:opacity-40`}
            >
              {k}
            </button>
          )
        })}
      </div>
    </div>
  )
}
