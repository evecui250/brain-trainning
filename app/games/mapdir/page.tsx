'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addSession } from '@/lib/storage'

const GRID = 4
const ROUNDS = 5
const SHOW_SECONDS = 8

type Pos = [number, number]
type Dir = 'up' | 'down' | 'left' | 'right'
type Phase = 'memorize' | 'pick' | 'result'

const DIR_ARROW: Record<Dir, string> = { up: '↑', down: '↓', left: '←', right: '→' }
const DIR_LABEL: Record<Dir, string> = { up: '上', down: '下', left: '左', right: '右' }
const DIRS: Dir[] = ['up', 'down', 'left', 'right']

function move(pos: Pos, dir: Dir): Pos {
  const [r, c] = pos
  if (dir === 'up')    return [r - 1, c]
  if (dir === 'down')  return [r + 1, c]
  if (dir === 'left')  return [r, c - 1]
  return [r, c + 1]
}

function inBounds(pos: Pos): boolean {
  return pos[0] >= 0 && pos[0] < GRID && pos[1] >= 0 && pos[1] < GRID
}

type Round = { start: Pos; steps: Dir[]; end: Pos }

function makeRound(): Round {
  const startRow = 1 + Math.floor(Math.random() * 2)
  const startCol = 1 + Math.floor(Math.random() * 2)
  const start: Pos = [startRow, startCol]

  const stepCount = 3 + Math.floor(Math.random() * 2)
  const steps: Dir[] = []
  let pos: Pos = start

  for (let i = 0; i < stepCount; i++) {
    const validDirs = DIRS.filter(d => inBounds(move(pos, d)))
    if (validDirs.length === 0) break
    const dir = validDirs[Math.floor(Math.random() * validDirs.length)]
    steps.push(dir)
    pos = move(pos, dir)
  }

  return { start, steps, end: pos }
}

function calcScore(guess: Pos, correct: Pos): number {
  const dist = Math.abs(guess[0] - correct[0]) + Math.abs(guess[1] - correct[1])
  if (dist === 0) return 100
  if (dist === 1) return 70
  if (dist === 2) return 40
  return 10
}

export default function MapDirGame() {
  const router = useRouter()
  const [rounds] = useState<Round[]>(() => Array.from({ length: ROUNDS }, makeRound))
  const [roundIdx, setRoundIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('memorize')
  const [countdown, setCountdown] = useState(SHOW_SECONDS)
  const [guess, setGuess] = useState<Pos | null>(null)
  const [scores, setScores] = useState<number[]>([])
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

  const handleCellTap = useCallback((row: number, col: number) => {
    if (phase !== 'pick') return
    setGuess([row, col])
  }, [phase])

  function submitGuess() {
    if (!guess) return
    const score = calcScore(guess, round.end)
    const newScores = [...scores, score]
    setScores(newScores)
    setPhase('result')
  }

  function nextRound() {
    if (roundIdx + 1 >= ROUNDS) {
      setAllDone(true)
    } else {
      setRoundIdx(r => r + 1)
      setGuess(null)
      setPhase('memorize')
    }
  }

  const header = (
    <div className="flex items-center gap-3 mb-6">
      <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
      <h1 className="text-xl font-bold text-slate-800">地图方向</h1>
      <span className="ml-auto text-sm text-slate-400">第 {roundIdx + 1}/{ROUNDS} 轮</span>
    </div>
  )

  if (allDone) {
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 min-h-screen flex flex-col">
        {header}
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-slate-500 text-base mb-2">全部完成！平均得分</p>
          <p className="text-7xl font-bold text-sky-500 mb-1">{avg}</p>
          <p className="text-slate-400 text-xl mb-6">分</p>
          <div className="w-full bg-white rounded-2xl p-4 shadow-sm mb-8">
            {scores.map((s, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-slate-500">第 {i + 1} 轮</span>
                <span className="font-semibold text-sky-600">{s} 分</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => { addSession('mapdir', '地图方向', avg); router.push('/games') }}
            className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl"
          >
            记录并继续
          </button>
        </div>
      </div>
    )
  }

  function Grid({ showStart, showEnd, showGuess, onTap, tapEnabled }: {
    showStart: boolean
    showEnd: boolean
    showGuess: boolean
    onTap?: (r: number, c: number) => void
    tapEnabled: boolean
  }) {
    return (
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
        {Array.from({ length: GRID }, (_, r) =>
          Array.from({ length: GRID }, (_, c) => {
            const isStart = showStart && round.start[0] === r && round.start[1] === c
            const isEnd = showEnd && round.end[0] === r && round.end[1] === c
            const isGuess = showGuess && guess && guess[0] === r && guess[1] === c
            const isSelected = tapEnabled && guess && guess[0] === r && guess[1] === c

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => tapEnabled && onTap?.(r, c)}
                className={`aspect-square rounded-xl flex items-center justify-center text-xl font-bold transition-all ${
                  isEnd ? 'bg-emerald-500 text-white shadow-md' :
                  isGuess ? 'bg-rose-400 text-white shadow-md' :
                  isStart ? 'bg-amber-400 text-white shadow-md' :
                  isSelected ? 'bg-sky-200 border-2 border-sky-500' :
                  tapEnabled ? 'bg-white border border-slate-200 shadow-sm active:scale-95' :
                  'bg-slate-100'
                }`}
              >
                {isEnd && showEnd && !isGuess ? '★' : isStart && showStart ? '★' : isGuess ? '●' : ''}
              </button>
            )
          })
        )}
      </div>
    )
  }

  if (phase === 'memorize') {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
        {header}
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sky-700 font-semibold">记住行走路线</p>
            <span className="text-2xl font-bold text-sky-600">{countdown}s</span>
          </div>
          <Grid showStart={true} showEnd={false} showGuess={false} tapEnabled={false} />
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 text-sm">路线：</span>
            {round.steps.map((dir, i) => (
              <span key={i} className="bg-white border border-sky-200 rounded-lg px-3 py-1 text-base font-semibold text-sky-700">
                {DIR_ARROW[dir]} {DIR_LABEL[dir]}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">★ 为出发点</p>
        </div>
        <div className="w-full bg-sky-100 rounded-full h-2">
          <div
            className="bg-sky-500 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${(countdown / SHOW_SECONDS) * 100}%` }}
          />
        </div>
        <p className="text-center text-sm text-slate-400 mt-3">记住路线后，点击终点位置</p>
      </div>
    )
  }

  if (phase === 'pick') {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
        {header}
        <p className="text-slate-500 text-sm text-center mb-4">
          按照刚才的路线，点击终点位置
        </p>
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="text-slate-400 text-sm">路线：</span>
            {round.steps.map((dir, i) => (
              <span key={i} className="bg-sky-50 border border-sky-200 rounded-lg px-2 py-0.5 text-sm font-semibold text-sky-700">
                {DIR_ARROW[dir]}
              </span>
            ))}
          </div>
          <Grid showStart={false} showEnd={false} showGuess={true} onTap={handleCellTap} tapEnabled={true} />
        </div>
        <button
          onClick={submitGuess}
          disabled={!guess}
          className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl disabled:opacity-30"
        >
          确认位置
        </button>
      </div>
    )
  }

  // phase === 'result'
  const roundScore = scores[scores.length - 1]
  const isCorrect = guess && guess[0] === round.end[0] && guess[1] === round.end[1]

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      {header}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <div className="text-center mb-4">
          <p className="text-slate-400 text-sm">{isCorrect ? '完全正确！' : '本轮得分'}</p>
          <p className="text-5xl font-bold text-sky-500">{roundScore}</p>
          <p className="text-slate-400">分</p>
        </div>
        <Grid showStart={true} showEnd={true} showGuess={!isCorrect} tapEnabled={false} />
        <div className="mt-3 flex gap-4 justify-center text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-amber-400 inline-block" />
            <span className="text-slate-500">出发点</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-emerald-500 inline-block" />
            <span className="text-slate-500">正确终点</span>
          </div>
          {!isCorrect && (
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-rose-400 inline-block" />
              <span className="text-slate-500">你的选择</span>
            </div>
          )}
        </div>
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
