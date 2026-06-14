'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addSession } from '@/lib/storage'

const TOTAL = 20
const GO_COUNT = 14
const NO_GO_COUNT = 6
const STIMULUS_MS = 1200
const FEEDBACK_MS = 800
const READY_MIN_MS = 800
const READY_MAX_MS = 1600

type TrialColor = 'green' | 'red'
type Response = 'hit' | 'miss' | 'false_alarm' | 'correct_rejection'
type Phase = 'intro' | 'ready' | 'stimulus' | 'feedback'

function makeTrials(): TrialColor[] {
  const arr: TrialColor[] = [
    ...Array(GO_COUNT).fill('green') as TrialColor[],
    ...Array(NO_GO_COUNT).fill('red') as TrialColor[],
  ]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function ReactionGame() {
  const router = useRouter()
  const [trials] = useState<TrialColor[]>(makeTrials)
  const [phase, setPhase] = useState<Phase>('intro')
  const [trialIdx, setTrialIdx] = useState(0)
  const [lastResponse, setLastResponse] = useState<Response | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [done, setDone] = useState(false)
  const respondedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const recordResponse = useCallback((color: TrialColor, tapped: boolean) => {
    if (respondedRef.current) return
    respondedRef.current = true
    clearTimer()

    let resp: Response
    if (color === 'green' && tapped) resp = 'hit'
    else if (color === 'green' && !tapped) resp = 'miss'
    else if (color === 'red' && tapped) resp = 'false_alarm'
    else resp = 'correct_rejection'

    setLastResponse(resp)
    setResponses(prev => [...prev, resp])
    setPhase('feedback')
  }, [])

  // ready → stimulus after random delay
  useEffect(() => {
    if (phase !== 'ready') return
    respondedRef.current = false
    const delay = READY_MIN_MS + Math.random() * (READY_MAX_MS - READY_MIN_MS)
    timerRef.current = setTimeout(() => setPhase('stimulus'), delay)
    return clearTimer
  }, [phase, trialIdx])

  // stimulus → auto-miss after STIMULUS_MS
  useEffect(() => {
    if (phase !== 'stimulus') return
    timerRef.current = setTimeout(() => {
      recordResponse(trials[trialIdx], false)
    }, STIMULUS_MS)
    return clearTimer
  }, [phase, trialIdx, trials, recordResponse])

  // feedback → next trial or done
  useEffect(() => {
    if (phase !== 'feedback') return
    timerRef.current = setTimeout(() => {
      const nextIdx = trialIdx + 1
      if (nextIdx >= TOTAL) {
        setDone(true)
      } else {
        setTrialIdx(nextIdx)
        setPhase('ready')
      }
    }, FEEDBACK_MS)
    return clearTimer
  }, [phase, trialIdx])

  const handleTap = useCallback(() => {
    if (phase === 'stimulus') {
      recordResponse(trials[trialIdx], true)
    }
  }, [phase, trials, trialIdx, recordResponse])

  if (done) {
    const allResponses = responses
    const hits = allResponses.filter(r => r === 'hit').length
    const correctRejections = allResponses.filter(r => r === 'correct_rejection').length
    const misses = allResponses.filter(r => r === 'miss').length
    const falseAlarms = allResponses.filter(r => r === 'false_alarm').length
    const score = Math.round(((hits + correctRejections) / TOTAL) * 100)
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 min-h-screen flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
          <h1 className="text-xl font-bold text-slate-800">反应训练</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-slate-500 text-base mb-2">训练结束！得分</p>
          <p className="text-7xl font-bold text-lime-500 mb-1">{score}</p>
          <p className="text-slate-400 text-xl mb-6">分</p>
          <div className="w-full bg-white rounded-2xl p-4 shadow-sm mb-8 space-y-2">
            <div className="flex justify-between text-base">
              <span className="text-slate-500">正确点击（绿色）</span>
              <span className="font-semibold text-emerald-600">{hits}/{GO_COUNT}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-slate-500">正确忍住（红色）</span>
              <span className="font-semibold text-emerald-600">{correctRejections}/{NO_GO_COUNT}</span>
            </div>
            <div className="flex justify-between text-base border-t border-slate-100 pt-2">
              <span className="text-slate-400">漏点</span>
              <span className="text-amber-500">{misses}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-slate-400">误点（红色）</span>
              <span className="text-red-400">{falseAlarms}</span>
            </div>
          </div>
          <button
            onClick={() => { addSession('reaction', '反应训练', score); router.push('/games') }}
            className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl"
          >
            记录并继续
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'intro') {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
          <h1 className="text-xl font-bold text-slate-800">反应训练</h1>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-500 flex-shrink-0" />
            <div>
              <p className="text-slate-800 font-semibold text-lg">见绿色 → 点击</p>
              <p className="text-slate-400 text-sm">看到绿色圆圈，立刻点击屏幕</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-500 flex-shrink-0" />
            <div>
              <p className="text-slate-800 font-semibold text-lg">见红色 → 不动</p>
              <p className="text-slate-400 text-sm">看到红色圆圈，忍住不要点击</p>
            </div>
          </div>
        </div>
        <p className="text-center text-slate-400 text-sm mb-6">共 {TOTAL} 次测试，尽量快速且准确</p>
        <button
          onClick={() => setPhase('ready')}
          className="w-full bg-lime-500 text-white text-xl font-bold py-5 rounded-2xl"
        >
          开始训练
        </button>
      </div>
    )
  }

  const circleColor =
    phase === 'ready' ? 'bg-slate-200' :
    phase === 'stimulus' ? (trials[trialIdx] === 'green' ? 'bg-green-500' : 'bg-red-500') :
    lastResponse === 'hit' || lastResponse === 'correct_rejection' ? 'bg-emerald-100' : 'bg-red-100'

  const feedbackText =
    lastResponse === 'hit' ? '✓ 点对了！' :
    lastResponse === 'miss' ? '× 没点到' :
    lastResponse === 'false_alarm' ? '× 不该点' :
    lastResponse === 'correct_rejection' ? '✓ 忍住了！' : ''

  const feedbackColor =
    lastResponse === 'hit' || lastResponse === 'correct_rejection' ? 'text-emerald-600' : 'text-red-500'

  return (
    <div
      className="max-w-lg mx-auto px-4 pt-6 pb-8 min-h-screen select-none"
      onClick={handleTap}
    >
      <div className="flex items-center justify-between mb-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
          <h1 className="text-xl font-bold text-slate-800">反应训练</h1>
        </div>
        <span className="text-slate-400 text-sm">{trialIdx + 1}/{TOTAL}</span>
      </div>

      <div className="flex flex-col items-center justify-center mt-12">
        <div className={`w-48 h-48 rounded-full transition-colors duration-150 ${circleColor} shadow-lg`} />

        {phase === 'ready' && (
          <p className="text-slate-400 text-lg mt-8">准备…</p>
        )}
        {phase === 'stimulus' && (
          <p className="text-2xl font-bold mt-8 text-slate-700">
            {trials[trialIdx] === 'green' ? '点击！' : '忍住！'}
          </p>
        )}
        {phase === 'feedback' && (
          <p className={`text-2xl font-bold mt-8 ${feedbackColor}`}>{feedbackText}</p>
        )}
      </div>

      {phase === 'ready' && (
        <p className="text-center text-slate-400 text-sm mt-16">圆圈出现时再操作</p>
      )}
    </div>
  )
}
