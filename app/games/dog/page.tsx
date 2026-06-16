'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addSession } from '@/lib/storage'

type DogVariant = 'white' | 'black' | 'brown' | 'golden' | 'gray' | 'spotted'
type DogPose = 'sit' | 'sleep' | 'sniff' | 'play'

const PALETTE: Record<DogVariant, { body: string; ear: string; outline: string; spots?: boolean }> = {
  white:   { body: '#F5F5F5', ear: '#EDD5D5', outline: '#D1D5DB' },
  black:   { body: '#2D2D2D', ear: '#1A1A1A', outline: '#111' },
  brown:   { body: '#8B4513', ear: '#6B3010', outline: '#5A2708' },
  golden:  { body: '#D4A017', ear: '#B88810', outline: '#9A7010' },
  gray:    { body: '#9CA3AF', ear: '#6B7280', outline: '#4B5563' },
  spotted: { body: '#F5F5F5', ear: '#EDD5D5', outline: '#D1D5DB', spots: true },
}

const DISTRACTORS: DogVariant[] = ['black', 'brown', 'golden', 'gray', 'spotted']

const ROUNDS = [
  { count: 12, label: '简单' },
  { count: 18, label: '中等' },
  { count: 24, label: '困难' },
  { count: 30, label: '高手' },
  { count: 36, label: '专家' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const POSES: DogPose[] = ['sit', 'sleep', 'sniff', 'play']

// Draw a sitting (front-facing) dog centered at 0,0, bounding box roughly -22..22 x -42..12
function SitDog({ body, ear, outline, spots }: { body: string; ear: string; outline: string; spots?: boolean }) {
  const ey = spots ? '#1a1a1a' : (body === '#2D2D2D' ? '#9CA3AF' : '#1a1a1a')
  return (
    <g>
      <path d="M18 0 Q26 -12 22 -22" stroke={body} strokeWidth="7" fill="none" strokeLinecap="round"/>
      <ellipse cx="0" cy="4" rx="14" ry="10" fill={body} stroke={outline} strokeWidth="0.6"/>
      <ellipse cx="-12" cy="-14" rx="6" ry="10" fill={ear} stroke={outline} strokeWidth="0.6" transform="rotate(-18 -12 -14)"/>
      <ellipse cx="12" cy="-14" rx="6" ry="10" fill={ear} stroke={outline} strokeWidth="0.6" transform="rotate(18 12 -14)"/>
      <circle cx="0" cy="-20" r="14" fill={body} stroke={outline} strokeWidth="0.6"/>
      <circle cx="-5" cy="-23" r="3.2" fill="white"/>
      <circle cx="5" cy="-23" r="3.2" fill="white"/>
      <circle cx="-4.5" cy="-23" r="2" fill={ey}/>
      <circle cx="5.5" cy="-23" r="2" fill={ey}/>
      <circle cx="-4" cy="-23.5" r="0.7" fill="white"/>
      <circle cx="6" cy="-23.5" r="0.7" fill="white"/>
      <ellipse cx="0" cy="-16" rx="3.5" ry="2.5" fill="#2d2d2d"/>
      <path d="M-4 -12 Q0 -9 4 -12" stroke="#2d2d2d" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <rect x="-12" y="9" width="7" height="9" rx="3.5" fill={body} stroke={outline} strokeWidth="0.5"/>
      <rect x="5" y="9" width="7" height="9" rx="3.5" fill={body} stroke={outline} strokeWidth="0.5"/>
      {spots && <>
        <circle cx="-2" cy="2" r="3.5" fill="#6b3a1f" opacity="0.6"/>
        <circle cx="8" cy="7" r="3" fill="#6b3a1f" opacity="0.6"/>
        <circle cx="-2" cy="-22" r="2.5" fill="#6b3a1f" opacity="0.5"/>
        <circle cx="6" cy="-15" r="2" fill="#6b3a1f" opacity="0.45"/>
      </>}
    </g>
  )
}

// Sleeping dog: horizontal oval, head to right
function SleepDog({ body, ear, outline, spots }: { body: string; ear: string; outline: string; spots?: boolean }) {
  const ey = body === '#2D2D2D' ? '#9CA3AF' : '#1a1a1a'
  return (
    <g>
      <path d="M-22 -2 Q-30 -10 -22 -16" stroke={body} strokeWidth="6" fill="none" strokeLinecap="round"/>
      <ellipse cx="-2" cy="0" rx="22" ry="10" fill={body} stroke={outline} strokeWidth="0.6"/>
      <ellipse cx="14" cy="-6" rx="7" ry="10" fill={ear} stroke={outline} strokeWidth="0.6" transform="rotate(15 14 -6)"/>
      <circle cx="18" cy="2" r="10" fill={body} stroke={outline} strokeWidth="0.6"/>
      <circle cx="21" cy="0" r="1.8" fill={ey}/>
      <ellipse cx="25" cy="4" rx="3.5" ry="2" fill="#2d2d2d"/>
      <path d="M22 7 Q25 10 28 8" stroke="#2d2d2d" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <rect x="-12" y="7" width="6" height="8" rx="3" fill={body} stroke={outline} strokeWidth="0.5"/>
      <rect x="-1" y="7" width="6" height="8" rx="3" fill={body} stroke={outline} strokeWidth="0.5"/>
      {spots && <>
        <circle cx="-5" cy="-2" r="3" fill="#6b3a1f" opacity="0.6"/>
        <circle cx="5" cy="4" r="2.5" fill="#6b3a1f" opacity="0.6"/>
      </>}
    </g>
  )
}

// Sniffing dog: head down near ground
function SniffDog({ body, ear, outline, spots }: { body: string; ear: string; outline: string; spots?: boolean }) {
  const ey = body === '#2D2D2D' ? '#9CA3AF' : '#1a1a1a'
  return (
    <g>
      <path d="M18 -5 Q26 -16 20 -24" stroke={body} strokeWidth="7" fill="none" strokeLinecap="round"/>
      <ellipse cx="0" cy="-5" rx="14" ry="10" fill={body} stroke={outline} strokeWidth="0.6"/>
      <ellipse cx="-10" cy="-25" rx="5" ry="8" fill={ear} stroke={outline} strokeWidth="0.6" transform="rotate(-10 -10 -25)"/>
      <ellipse cx="10" cy="-25" rx="5" ry="8" fill={ear} stroke={outline} strokeWidth="0.6" transform="rotate(10 10 -25)"/>
      <circle cx="0" cy="-28" r="12" fill={body} stroke={outline} strokeWidth="0.6"/>
      <circle cx="-4" cy="-30" r="2.5" fill="white"/>
      <circle cx="4" cy="-30" r="2.5" fill="white"/>
      <circle cx="-3.5" cy="-30" r="1.6" fill={ey}/>
      <circle cx="4.5" cy="-30" r="1.6" fill={ey}/>
      <ellipse cx="0" cy="-22" rx="3.5" ry="2.5" fill="#2d2d2d"/>
      <ellipse cx="0" cy="-19" rx="2.5" ry="1.5" fill="#f9a8d4" opacity="0.7"/>
      <rect x="-12" y="2" width="7" height="9" rx="3.5" fill={body} stroke={outline} strokeWidth="0.5"/>
      <rect x="5" y="2" width="7" height="9" rx="3.5" fill={body} stroke={outline} strokeWidth="0.5"/>
      {spots && <>
        <circle cx="-3" cy="-5" r="3" fill="#6b3a1f" opacity="0.6"/>
        <circle cx="7" cy="-1" r="2.5" fill="#6b3a1f" opacity="0.6"/>
      </>}
    </g>
  )
}

// Playful bow: butt up, head down (play bow)
function PlayDog({ body, ear, outline, spots }: { body: string; ear: string; outline: string; spots?: boolean }) {
  const ey = body === '#2D2D2D' ? '#9CA3AF' : '#1a1a1a'
  return (
    <g>
      <path d="M-18 -18 Q-28 -8 -20 0" stroke={body} strokeWidth="7" fill="none" strokeLinecap="round"/>
      <ellipse cx="4" cy="-8" rx="18" ry="9" fill={body} stroke={outline} strokeWidth="0.6" transform="rotate(-15 4 -8)"/>
      <ellipse cx="-14" cy="4" rx="5" ry="8" fill={ear} stroke={outline} strokeWidth="0.6" transform="rotate(-30 -14 4)"/>
      <ellipse cx="-4" cy="4" rx="5" ry="8" fill={ear} stroke={outline} strokeWidth="0.6" transform="rotate(-10 -4 4)"/>
      <circle cx="-12" cy="10" r="11" fill={body} stroke={outline} strokeWidth="0.6"/>
      <circle cx="-16" cy="8" r="2.8" fill="white"/>
      <circle cx="-8" cy="7" r="2.8" fill="white"/>
      <circle cx="-15.5" cy="8" r="1.8" fill={ey}/>
      <circle cx="-7.5" cy="7" r="1.8" fill={ey}/>
      <ellipse cx="-12" cy="14" rx="3" ry="2.2" fill="#2d2d2d"/>
      <rect x="10" y="-20" width="6" height="10" rx="3" fill={body} stroke={outline} strokeWidth="0.5"/>
      <rect x="18" y="-22" width="6" height="10" rx="3" fill={body} stroke={outline} strokeWidth="0.5"/>
      <rect x="-18" y="16" width="6" height="9" rx="3" fill={body} stroke={outline} strokeWidth="0.5"/>
      <rect x="-8" y="18" width="6" height="9" rx="3" fill={body} stroke={outline} strokeWidth="0.5"/>
      {spots && <>
        <circle cx="5" cy="-12" r="3" fill="#6b3a1f" opacity="0.6"/>
        <circle cx="-10" cy="8" r="2.5" fill="#6b3a1f" opacity="0.5"/>
      </>}
    </g>
  )
}

function DogShape({ variant, pose, scale }: { variant: DogVariant; pose: DogPose; scale: number }) {
  const { body, ear, outline, spots } = PALETTE[variant]
  const props = { body, ear, outline, spots }
  const Component = pose === 'sleep' ? SleepDog : pose === 'sniff' ? SniffDog : pose === 'play' ? PlayDog : SitDog
  return <g transform={`scale(${scale})`}><Component {...props}/></g>
}

type DogData = { x: number; y: number; scale: number; pose: DogPose; variant: DogVariant }

function sceneHeight(count: number) {
  return count <= 24 ? 340 : count <= 30 ? 390 : 440
}

function generateDogs(count: number): DogData[] {
  const cols = count <= 12 ? 4 : count <= 18 ? 5 : 6
  const rows = Math.ceil(count / cols)
  const sceneW = 360, sceneH = sceneHeight(count)
  const topMargin = 115
  const cellW = (sceneW - 30) / cols
  const cellH = (sceneH - topMargin - 20) / rows
  const scale = count <= 12 ? 0.70 : count <= 18 ? 0.58 : count <= 24 ? 0.48 : count <= 30 ? 0.53 : 0.47

  const variants: DogVariant[] = shuffle([
    'white',
    ...Array.from({ length: count - 1 }, (_, i) => DISTRACTORS[i % DISTRACTORS.length]),
  ] as DogVariant[])

  const poses: DogPose[] = shuffle(
    Array.from({ length: count }, (_, i) => POSES[i % POSES.length])
  )

  const result: DogData[] = []
  for (let i = 0; i < count; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const jx = (Math.random() - 0.5) * cellW * 0.35
    const jy = (Math.random() - 0.5) * cellH * 0.3
    result.push({
      x: 15 + col * cellW + cellW / 2 + jx,
      y: topMargin + row * cellH + cellH * 0.65 + jy,
      scale,
      pose: poses[i],
      variant: variants[i],
    })
  }
  return result
}

export default function DogGame() {
  const router = useRouter()
  const [allRounds] = useState<DogData[][]>(() => ROUNDS.map(r => generateDogs(r.count)))
  const [roundIdx, setRoundIdx] = useState(0)
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro')
  const [wrongFlash, setWrongFlash] = useState<number | null>(null)
  const [wrongCount, setWrongCount] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [scores, setScores] = useState<number[]>([])

  const dogs = allRounds[roundIdx]
  const whiteIdx = dogs.findIndex(d => d.variant === 'white')

  const handleTap = useCallback((idx: number) => {
    if (submitted) return
    if (dogs[idx].variant === 'white') {
      setScores(p => [...p, wrongCount === 0 ? 100 : 50])
      setSubmitted(true)
    } else {
      setWrongFlash(idx)
      setWrongCount(c => c + 1)
      setTimeout(() => setWrongFlash(null), 600)
    }
  }, [submitted, dogs, wrongCount])

  const handleSVGClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (submitted) return
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const clickX = (e.clientX - rect.left) * (360 / rect.width)
    const clickY = (e.clientY - rect.top) * (sceneHeight(dogs.length) / rect.height)
    let minDist = Infinity
    let nearestIdx = -1
    dogs.forEach((d, i) => {
      const dx = clickX - d.x
      const dy = clickY - d.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < minDist) { minDist = dist; nearestIdx = i }
    })
    if (nearestIdx >= 0 && minDist < 42) handleTap(nearestIdx)
  }, [submitted, dogs, handleTap])

  function handleCantFind() {
    if (submitted) return
    setScores(p => [...p, 0])
    setSubmitted(true)
  }

  function nextRound() {
    if (roundIdx + 1 >= ROUNDS.length) { setPhase('done'); return }
    setRoundIdx(r => r + 1)
    setWrongCount(0)
    setSubmitted(false)
  }

  const header = (
    <div className="flex items-center gap-3 mb-3">
      <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
      <h1 className="text-xl font-bold text-slate-800">找白狗</h1>
      {phase === 'play' && <span className="ml-auto text-sm text-slate-400">{ROUNDS[roundIdx].label} · {roundIdx + 1}/{ROUNDS.length}</span>}
    </div>
  )

  if (phase === 'intro') {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
        {header}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <p className="text-slate-700 text-lg font-semibold mb-2">狗狗们在院子里玩！</p>
          <p className="text-slate-500 mb-4">找出唯一的<b className="text-slate-800">纯白色小狗</b>，点击它</p>
          <div className="flex gap-3 justify-center">
            {(['white','golden','brown','black'] as DogVariant[]).map(v => (
              <div key={v} className={`rounded-xl p-2 ${v === 'white' ? 'bg-emerald-50 border-2 border-emerald-400 ring-2 ring-emerald-200' : 'bg-slate-50'}`} style={{ width: 64, height: 74 }}>
                <svg viewBox="-22 -42 44 60" width="100%" height="100%">
                  <DogShape variant={v} pose="sit" scale={1}/>
                </svg>
              </div>
            ))}
          </div>
          <p className="text-center text-emerald-600 text-sm mt-2 font-semibold">← 这只是白狗</p>
        </div>
        <button onClick={() => setPhase('play')} className="w-full bg-yellow-400 text-slate-800 text-xl font-bold py-5 rounded-2xl">
          开始寻找
        </button>
      </div>
    )
  }

  if (phase === 'done') {
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 min-h-screen flex flex-col">
        {header}
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-slate-400 mb-2">全部完成！平均得分</p>
          <p className="text-7xl font-bold text-yellow-500 mb-1">{avg}</p>
          <p className="text-slate-400 text-xl mb-6">分</p>
          <div className="w-full bg-white rounded-2xl p-4 shadow-sm mb-8">
            {scores.map((s, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-slate-500">{ROUNDS[i].label}</span>
                <span className={`font-semibold ${s === 100 ? 'text-emerald-600' : s === 50 ? 'text-amber-500' : 'text-red-400'}`}>{s} 分</span>
              </div>
            ))}
          </div>
          <button onClick={() => { addSession('dog', '找白狗', avg); router.push('/games') }}
            className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl">
            记录并继续
          </button>
        </div>
      </div>
    )
  }

  const lastScore = scores[scores.length - 1]

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-6">
      {header}

      {submitted ? (
        <div className={`text-center rounded-xl py-2 mb-2 text-base font-semibold ${lastScore > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
          {lastScore === 100 ? '一下找到！满分！' : lastScore === 50 ? '找到了！' : '没找到，白狗高亮显示'}
        </div>
      ) : (
        <p className="text-center text-slate-500 text-sm mb-2">
          找出院子里唯一的<b className="text-slate-700">白色小狗</b>并点击
          {wrongCount > 0 && <span className="text-amber-500 ml-2">（已点错 {wrongCount} 次）</span>}
        </p>
      )}

      {/* Yard scene */}
      <div className="rounded-2xl overflow-hidden border border-green-200 shadow-sm mb-3">
        <svg viewBox={`0 0 360 ${sceneHeight(dogs.length)}`} width="100%" style={{ display: 'block', cursor: submitted ? 'default' : 'pointer' }} onClick={handleSVGClick}>
          {/* Sky */}
          <rect x="0" y="0" width="360" height="105" fill="#BAE6FD"/>
          {/* Sun */}
          <circle cx="320" cy="32" r="18" fill="#FDE68A"/>
          {/* Clouds */}
          <ellipse cx="60" cy="28" rx="30" ry="14" fill="white" opacity="0.85"/>
          <ellipse cx="85" cy="25" rx="22" ry="12" fill="white" opacity="0.85"/>
          <ellipse cx="180" cy="40" rx="28" ry="13" fill="white" opacity="0.75"/>
          {/* Ground fade */}
          <rect x="0" y="100" width="360" height="18" fill="#34D399"/>
          {/* Grass */}
          <rect x="0" y="112" width="360" height={sceneHeight(dogs.length) - 112} fill="#4ADE80"/>
          {/* Fence in background */}
          {[20,60,100,140,180,220,260,300,340].map(x => (
            <g key={x}>
              <rect x={x} y="90" width="8" height="32" rx="2" fill="#D97706" opacity="0.7"/>
            </g>
          ))}
          <rect x="14" y="94" width="332" height="6" rx="2" fill="#B45309" opacity="0.6"/>
          <rect x="14" y="108" width="332" height="5" rx="2" fill="#B45309" opacity="0.5"/>
          {/* Flower decorations */}
          {[45,140,250,320].map(x => (
            <g key={x}>
              <circle cx={x} cy="118" r="4" fill="#F472B6"/>
              <circle cx={x+12} cy="122" r="3.5" fill="#FBBF24"/>
              <circle cx={x-8} cy="123" r="3" fill="#F472B6"/>
            </g>
          ))}

          {/* Dogs */}
          {dogs.map((d, i) => {
            const isWhite = d.variant === 'white'
            const isWrong = wrongFlash === i
            const dimmed = submitted && !isWhite
            const highlighted = submitted && isWhite
            return (
              <g key={i}
                transform={`translate(${d.x},${d.y})`}
                opacity={dimmed ? 0.35 : 1}
              >
                {/* Highlight ring for found white dog */}
                {highlighted && (
                  <ellipse cx="0" cy="2" rx={20 * d.scale / 0.7} ry={14 * d.scale / 0.7} fill="none" stroke="#10B981" strokeWidth="3"/>
                )}
                {/* Wrong flash */}
                {isWrong && (
                  <ellipse cx="0" cy="2" rx={20 * d.scale / 0.7} ry={14 * d.scale / 0.7} fill="#FCA5A5" opacity="0.5"/>
                )}
                <DogShape variant={d.variant} pose={d.pose} scale={d.scale}/>
                {/* Shadow */}
                <ellipse cx="0" cy={10 * d.scale / 0.7} rx={16 * d.scale / 0.7} ry={4 * d.scale / 0.7} fill="#000" opacity="0.08"/>
              </g>
            )
          })}
        </svg>
      </div>

      {submitted ? (
        <button onClick={nextRound} className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl">
          {roundIdx + 1 < ROUNDS.length ? '下一关' : '查看结果'}
        </button>
      ) : (
        <button onClick={handleCantFind} className="w-full bg-slate-100 text-slate-500 text-base font-medium py-3 rounded-xl">
          找不到白狗
        </button>
      )}
    </div>
  )
}
