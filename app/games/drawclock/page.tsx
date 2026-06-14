'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addSession } from '@/lib/storage'

const TIMES = [
  { h: 3,  m: 0  }, { h: 9,  m: 0  }, { h: 12, m: 0  }, { h: 6,  m: 0  },
  { h: 3,  m: 30 }, { h: 6,  m: 45 }, { h: 10, m: 10 }, { h: 1,  m: 30 },
  { h: 2,  m: 50 }, { h: 7,  m: 25 },
]
const ROUNDS = 5

function getTargets() {
  return [...TIMES].sort(() => Math.random() - 0.5).slice(0, ROUNDS)
}

function timeToAngle(h: number, m: number, isHour: boolean): number {
  return isHour
    ? ((h % 12) + m / 60) / 12 * 360
    : m / 60 * 360
}

function angDiff(a: number, b: number): number {
  const d = Math.abs(a - b)
  return Math.min(d, 360 - d)
}

function calcScore(target: { h: number; m: number }, hourAngle: number, minAngle: number): number {
  const hErr = angDiff(timeToAngle(target.h, target.m, true), hourAngle)
  const mErr = angDiff(timeToAngle(target.h, target.m, false), minAngle)
  const hScore = Math.max(0, 100 - hErr * 1.8)
  const mScore = Math.max(0, 100 - mErr * 1.8)
  return Math.round((hScore + mScore) / 2)
}

// ── Clock SVG ──────────────────────────────────────────────────────────────
const CX = 130, CY = 130, R = 118

function toXY(angleDeg: number, len: number): [number, number] {
  const rad = (angleDeg - 90) * Math.PI / 180
  return [CX + Math.cos(rad) * len, CY + Math.sin(rad) * len]
}

function ClockSVG({
  hourAngle, minAngle,
  correctHour, correctMin,
  showCorrect, onTap,
}: {
  hourAngle: number | null
  minAngle: number | null
  correctHour?: number
  correctMin?: number
  showCorrect?: boolean
  onTap?: (angle: number) => void
}) {
  function handlePointer(e: React.PointerEvent<SVGSVGElement>) {
    if (!onTap) return
    const rect = e.currentTarget.getBoundingClientRect()
    const scale = 260 / rect.width
    const x = (e.clientX - rect.left) * scale - CX
    const y = (e.clientY - rect.top) * scale - CY
    const angle = ((Math.atan2(x, -y) * 180 / Math.PI) + 360) % 360
    onTap(angle)
  }

  const nums = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

  return (
    <svg
      width="100%" viewBox="0 0 260 260"
      onPointerDown={handlePointer}
      style={{ touchAction: 'none', cursor: onTap ? 'crosshair' : 'default', maxWidth: 300 }}
    >
      <circle cx={CX} cy={CY} r={R} fill="white" stroke="#e2e8f0" strokeWidth="2" />
      {/* Hour ticks */}
      {nums.map((_, i) => {
        const a = i * 30
        const [x1, y1] = toXY(a, R - 4)
        const [x2, y2] = toXY(a, R - (i % 3 === 0 ? 14 : 8))
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 3 === 0 ? '#94a3b8' : '#cbd5e1'} strokeWidth={i % 3 === 0 ? 2.5 : 1.5} />
      })}
      {/* Numbers */}
      {nums.map((n, i) => {
        const [x, y] = toXY(i * 30, R - 26)
        return <text key={n} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="16" fill="#475569" fontWeight={n % 3 === 0 ? '600' : '400'} fontFamily="system-ui">{n}</text>
      })}
      {/* Correct hands (green, shown after result) */}
      {showCorrect && correctHour !== undefined && (() => {
        const [hx, hy] = toXY(correctHour, R * 0.5)
        const [mx, my] = toXY(correctMin!, R * 0.72)
        return <>
          <line x1={CX} y1={CY} x2={hx} y2={hy} stroke="#86efac" strokeWidth="6" strokeLinecap="round" />
          <line x1={CX} y1={CY} x2={mx} y2={my} stroke="#86efac" strokeWidth="4" strokeLinecap="round" />
        </>
      })()}
      {/* User's hour hand */}
      {hourAngle !== null && (() => {
        const [x, y] = toXY(hourAngle, R * 0.5)
        return <line x1={CX} y1={CY} x2={x} y2={y} stroke="#4f46e5" strokeWidth="6" strokeLinecap="round" />
      })()}
      {/* User's minute hand */}
      {minAngle !== null && (() => {
        const [x, y] = toXY(minAngle, R * 0.72)
        return <line x1={CX} y1={CY} x2={x} y2={y} stroke="#818cf8" strokeWidth="4" strokeLinecap="round" />
      })()}
      <circle cx={CX} cy={CY} r="5" fill="#334155" />
    </svg>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
type Step = 'hour' | 'minute' | 'result'

export default function DrawClockGame() {
  const router = useRouter()
  const [targets] = useState(getTargets)
  const [round, setRound] = useState(0)
  const [step, setStep] = useState<Step>('hour')
  const [hourAngle, setHourAngle] = useState<number | null>(null)
  const [minAngle, setMinAngle] = useState<number | null>(null)
  const [lastScore, setLastScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [done, setDone] = useState(false)

  const target = targets[round]
  const timeStr = `${target.h}:${String(target.m).padStart(2, '0')}`
  const correctHour = timeToAngle(target.h, target.m, true)
  const correctMin = timeToAngle(target.h, target.m, false)

  function handleTap(angle: number) {
    if (step === 'hour') {
      setHourAngle(angle)
      setStep('minute')
    } else if (step === 'minute') {
      setMinAngle(angle)
    }
  }

  function confirm() {
    if (hourAngle === null || minAngle === null) return
    const s = calcScore(target, hourAngle, minAngle)
    setLastScore(s)
    setTotal(t => t + s)
    setStep('result')
  }

  function next() {
    if (round + 1 >= ROUNDS) {
      setDone(true)
    } else {
      setRound(r => r + 1)
      setStep('hour')
      setHourAngle(null)
      setMinAngle(null)
    }
  }

  if (done) {
    const avg = Math.round(total / ROUNDS)
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 min-h-screen flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
          <h1 className="text-xl font-bold text-slate-800">画时钟</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-slate-500 text-base mb-2">平均得分</p>
          <p className="text-7xl font-bold text-indigo-600 mb-1">{avg}</p>
          <p className="text-slate-400 text-base mb-8">满分 100 分</p>
          <button
            onClick={() => { addSession('drawclock', '画时钟', avg); router.push('/games') }}
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
          <h1 className="text-xl font-bold text-slate-800">画时钟</h1>
        </div>
        <span className="text-slate-400 text-sm">{round + 1}/{ROUNDS}</span>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
        <div className="text-center mb-3">
          <p className="text-slate-500 text-sm mb-1">请画出这个时间</p>
          <p className="text-4xl font-bold text-slate-800">{timeStr}</p>
        </div>

        <div className="flex justify-center">
          <ClockSVG
            hourAngle={hourAngle}
            minAngle={minAngle}
            correctHour={correctHour}
            correctMin={correctMin}
            showCorrect={step === 'result'}
            onTap={step !== 'result' ? handleTap : undefined}
          />
        </div>

        <div className="text-center mt-3 text-slate-500 text-sm">
          {step === 'hour' && '点击表盘 — 放置时针（短针）'}
          {step === 'minute' && (
            <div>
              <p>点击表盘 — 放置分针（长针）</p>
              <button onClick={() => { setHourAngle(null); setStep('hour') }} className="text-slate-400 text-xs underline mt-1">
                重新放置时针
              </button>
            </div>
          )}
          {step === 'result' && <p className="text-emerald-600 text-sm">绿色为正确位置</p>}
        </div>
      </div>

      {step === 'minute' && minAngle !== null && (
        <button onClick={confirm} className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl mb-3">
          确认
        </button>
      )}

      {step === 'result' && (
        <div className="text-center">
          <p className={`text-4xl font-bold mb-3 ${lastScore >= 80 ? 'text-emerald-500' : lastScore >= 50 ? 'text-amber-500' : 'text-rose-400'}`}>
            {lastScore}<span className="text-xl text-slate-300 ml-1">分</span>
          </p>
          <button onClick={next} className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl">
            {round + 1 >= ROUNDS ? '查看结果' : '下一题'}
          </button>
        </div>
      )}
    </div>
  )
}
