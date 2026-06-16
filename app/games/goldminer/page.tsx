'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { addSession } from '@/lib/storage'

const PIVOT_X = 180
const PIVOT_Y = 42
const MIN_LEN = 55
const MAX_LEN = 310
const MAX_SWING = 68       // degrees from vertical
const SWING_SPEED = 2.8    // degrees per tick
const EXTEND_SPEED = 7
const RETRACT_EMPTY = 14
const RETRACT_GOLD = 7
const TICK_MS = 50
const GAME_SECS = 50

type Gold = { id: number; x: number; y: number; r: number; grabbed: boolean; removed: boolean }
type Phase = 'swinging' | 'extending' | 'retracting'

function makeGolds(): Gold[] {
  const templates = [
    { x: 75,  y: 140, r: 17 }, { x: 175, y: 155, r: 22 }, { x: 265, y: 135, r: 15 }, { x: 320, y: 148, r: 13 },
    { x: 55,  y: 210, r: 20 }, { x: 140, y: 195, r: 15 }, { x: 195, y: 200, r: 14 }, { x: 300, y: 195, r: 18 },
    { x: 55,  y: 262, r: 17 }, { x: 115, y: 275, r: 16 }, { x: 230, y: 260, r: 21 }, { x: 285, y: 268, r: 13 }, { x: 330, y: 255, r: 14 },
    { x: 80,  y: 320, r: 18 }, { x: 185, y: 310, r: 16 }, { x: 260, y: 318, r: 14 },
  ]
  return templates.map((t, id) => ({
    id, x: t.x + (Math.random() - 0.5) * 24,
    y: t.y + (Math.random() - 0.5) * 20,
    r: t.r, grabbed: false, removed: false,
  }))
}

function GoldSVG({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
      <ellipse cx={x - r * 0.25} cy={y - r * 0.3} rx={r * 0.45} ry={r * 0.3} fill="#FBBF24" opacity="0.65"/>
      <ellipse cx={x + r * 0.2} cy={y + r * 0.25} rx={r * 0.3} ry={r * 0.2} fill="#D97706" opacity="0.4"/>
    </g>
  )
}

function ClawSVG({ angle, armLen, golds, grabbedId }: {
  angle: number; armLen: number; golds: Gold[]; grabbedId: number | null
}) {
  const rad = angle * Math.PI / 180
  const tipX = PIVOT_X + Math.sin(rad) * armLen
  const tipY = PIVOT_Y + Math.cos(rad) * armLen

  // Perpendicular and arm direction for claw prongs
  const perpX = Math.cos(rad), perpY = -Math.sin(rad)
  const armX = Math.sin(rad), armY = Math.cos(rad)
  const PRONG = 14, PRONG_BACK = 10

  const p1x = tipX - perpX * PRONG - armX * PRONG_BACK
  const p1y = tipY - perpY * PRONG - armY * PRONG_BACK
  const p2x = tipX + perpX * PRONG - armX * PRONG_BACK
  const p2y = tipY + perpY * PRONG - armY * PRONG_BACK

  const grabbed = grabbedId !== null ? golds.find(g => g.id === grabbedId) : null

  return (
    <g>
      {/* Rope */}
      <line x1={PIVOT_X} y1={PIVOT_Y} x2={tipX} y2={tipY} stroke="#8B5E3C" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Claw prongs */}
      <line x1={tipX} y1={tipY} x2={p1x} y2={p1y} stroke="#6B7280" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1={tipX} y1={tipY} x2={p2x} y2={p2y} stroke="#6B7280" strokeWidth="3.5" strokeLinecap="round"/>
      {/* Claw joint */}
      <circle cx={tipX} cy={tipY} r="4.5" fill="#4B5563"/>
      {/* Grabbed gold follows claw */}
      {grabbed && !grabbed.removed && (
        <GoldSVG x={tipX} y={tipY + grabbed.r + 4} r={grabbed.r * 0.9}/>
      )}
    </g>
  )
}

export default function GoldMinerGame() {
  const router = useRouter()
  const gs = useRef({
    phase: 'swinging' as Phase,
    angle: 0,
    angleVel: SWING_SPEED,
    armLen: MIN_LEN,
    grabbedId: null as number | null,
    score: 0,
    golds: makeGolds(),
  })

  const [, setTick] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_SECS)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [flashText, setFlashText] = useState<string | null>(null)

  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeRef = useRef(GAME_SECS)

  function showFlash(text: string) {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    setFlashText(text)
    flashTimerRef.current = setTimeout(() => setFlashText(null), 900)
  }

  function fire() {
    if (gs.current.phase !== 'swinging') return
    gs.current.phase = 'extending'
  }

  useEffect(() => {
    if (!started) return

    // Countdown timer
    timerRef.current = setInterval(() => {
      timeRef.current--
      setTimeLeft(timeRef.current)
      if (timeRef.current <= 0) {
        clearInterval(timerRef.current!)
        setGameOver(true)
      }
    }, 1000)

    // Game loop
    const loop = setInterval(() => {
      if (gameOver || timeRef.current <= 0) return
      const g = gs.current

      if (g.phase === 'swinging') {
        g.angle += g.angleVel
        if (g.angle >= MAX_SWING || g.angle <= -MAX_SWING) {
          g.angleVel = -g.angleVel
          g.angle = Math.max(-MAX_SWING, Math.min(MAX_SWING, g.angle))
        }
      } else if (g.phase === 'extending') {
        g.armLen += EXTEND_SPEED
        const rad = g.angle * Math.PI / 180
        const tipX = PIVOT_X + Math.sin(rad) * g.armLen
        const tipY = PIVOT_Y + Math.cos(rad) * g.armLen
        // Collision
        for (const gold of g.golds) {
          if (gold.grabbed || gold.removed) continue
          const dx = tipX - gold.x, dy = tipY - gold.y
          if (Math.sqrt(dx * dx + dy * dy) < gold.r + 12) {
            gold.grabbed = true
            g.grabbedId = gold.id
            g.phase = 'retracting'
            break
          }
        }
        if (g.phase === 'extending' && g.armLen >= MAX_LEN) {
          g.phase = 'retracting'
        }
      } else if (g.phase === 'retracting') {
        const speed = g.grabbedId !== null ? RETRACT_GOLD : RETRACT_EMPTY
        g.armLen -= speed
        if (g.armLen <= MIN_LEN) {
          g.armLen = MIN_LEN
          if (g.grabbedId !== null) {
            const gold = g.golds.find(gl => gl.id === g.grabbedId)
            if (gold) {
              gold.removed = true
              gold.grabbed = false
              g.score++
              showFlash('+1 金块！')
            }
            g.grabbedId = null
          }
          g.phase = 'swinging'
        }
      }

      setTick(t => t + 1)
    }, TICK_MS)

    return () => {
      clearInterval(loop)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [started])

  if (!started) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
          <h1 className="text-xl font-bold text-slate-800">黄金矿工</h1>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <p className="text-slate-700 text-lg font-semibold mb-3">玩法</p>
          <p className="text-slate-500 mb-2">爪子会自动左右摆动</p>
          <p className="text-slate-500 mb-2">看准时机，点击屏幕放下爪子</p>
          <p className="text-slate-500 mb-4">抓到黄金就得 <b className="text-amber-600">+1 块</b>，共 {GAME_SECS} 秒</p>
        </div>
        <button onClick={() => { gs.current.golds = makeGolds(); setStarted(true) }}
          className="w-full bg-amber-500 text-white text-xl font-bold py-5 rounded-2xl">
          开始挖矿
        </button>
      </div>
    )
  }

  if (gameOver) {
    const score = gs.current.score
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 min-h-screen flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
          <h1 className="text-xl font-bold text-slate-800">黄金矿工</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-slate-400 mb-2">时间到！共挖到</p>
          <p className="text-7xl font-bold text-amber-500 mb-1">{score}</p>
          <p className="text-slate-400 text-xl mb-8">块黄金</p>
          <button onClick={() => { addSession('goldminer', '黄金矿工', score); router.push('/games') }}
            className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl">
            记录并继续
          </button>
        </div>
      </div>
    )
  }

  const g = gs.current
  const rad = g.angle * Math.PI / 180
  const tipX = PIVOT_X + Math.sin(rad) * g.armLen
  const tipY = PIVOT_Y + Math.cos(rad) * g.armLen

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-4" onClick={fire} style={{ userSelect: 'none' }}>
      <div className="flex items-center justify-between mb-2" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
          <h1 className="text-xl font-bold text-slate-800">黄金矿工</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-600 font-bold text-lg">金: {g.score}</span>
          <span className={`font-bold text-lg ${timeLeft <= 10 ? 'text-red-500' : 'text-slate-500'}`}>{timeLeft}s</span>
        </div>
      </div>

      {/* Flash */}
      <div className="text-center h-8 mb-1">
        {flashText && <span className="text-amber-600 font-bold text-xl">{flashText}</span>}
      </div>

      {/* Game scene */}
      <div className="rounded-2xl overflow-hidden border border-amber-200">
        <svg viewBox="0 0 360 390" width="100%" style={{ display: 'block' }}>
          {/* Sky/surface */}
          <rect x="0" y="0" width="360" height="75" fill="#92400E"/>
          <rect x="0" y="0" width="360" height="18" fill="#4ADE80"/>
          {/* Grass on surface */}
          {[15,40,65,90,115,140,165,190,215,240,265,290,315,340].map(x => (
            <line key={x} x1={x} y1="18" x2={x} y2="5" stroke="#22C55E" strokeWidth="4" strokeLinecap="round"/>
          ))}
          {/* Mine support beams */}
          <rect x="10" y="18" width="14" height="58" rx="4" fill="#6B3A2A"/>
          <rect x="336" y="18" width="14" height="58" rx="4" fill="#6B3A2A"/>
          <rect x="10" y="58" width="340" height="12" rx="4" fill="#5A2E1E"/>
          {/* Pivot wheel */}
          <circle cx={PIVOT_X} cy={PIVOT_Y - 10} r="10" fill="#4B5563"/>
          <circle cx={PIVOT_X} cy={PIVOT_Y - 10} r="5" fill="#9CA3AF"/>
          {/* Underground */}
          <rect x="0" y="75" width="360" height="315" fill="#3D2314"/>
          {/* Soil layers */}
          <rect x="0" y="120" width="360" height="8" fill="#4A2D1B" opacity="0.5"/>
          <rect x="0" y="185" width="360" height="6" fill="#4A2D1B" opacity="0.4"/>
          <rect x="0" y="250" width="360" height="6" fill="#4A2D1B" opacity="0.3"/>
          {/* Rock decorations */}
          <ellipse cx="40" cy="160" rx="18" ry="12" fill="#5A3820" opacity="0.7"/>
          <ellipse cx="310" cy="230" rx="22" ry="14" fill="#5A3820" opacity="0.6"/>
          <ellipse cx="150" cy="340" rx="16" ry="10" fill="#5A3820" opacity="0.5"/>
          {/* Gold nuggets */}
          {g.golds.filter(gold => !gold.removed && !gold.grabbed).map(gold => (
            <GoldSVG key={gold.id} x={gold.x} y={gold.y} r={gold.r}/>
          ))}
          {/* Claw and rope */}
          <ClawSVG angle={g.angle} armLen={g.armLen} golds={g.golds} grabbedId={g.grabbedId}/>
        </svg>
      </div>

      <p className="text-center text-slate-400 text-sm mt-3">点击屏幕放下爪子</p>
    </div>
  )
}
