'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addSession } from '@/lib/storage'

type DogVariant = 'white' | 'black' | 'brown' | 'golden' | 'gray' | 'spotted'

const DOG_PALETTE: Record<DogVariant, { body: string; ear: string; outline: string; spots?: boolean }> = {
  white:   { body: '#F4F4F4', ear: '#E8D5D5', outline: '#D1D5DB' },
  black:   { body: '#2D2D2D', ear: '#1A1A1A', outline: '#1A1A1A' },
  brown:   { body: '#8B4513', ear: '#6B3010', outline: '#6B3010' },
  golden:  { body: '#D4A017', ear: '#B88A10', outline: '#B88A10' },
  gray:    { body: '#9CA3AF', ear: '#6B7280', outline: '#6B7280' },
  spotted: { body: '#F4F4F4', ear: '#E8D5D5', outline: '#D1D5DB', spots: true },
}

const DISTRACTORS: DogVariant[] = ['black', 'brown', 'golden', 'gray', 'spotted']

const ROUNDS = [
  { count: 6,  cols: 3, label: '简单' },
  { count: 12, cols: 3, label: '中等' },
  { count: 20, cols: 4, label: '困难' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeDogs(count: number): DogVariant[] {
  const pool: DogVariant[] = Array.from({ length: count - 1 }, () =>
    DISTRACTORS[Math.floor(Math.random() * DISTRACTORS.length)]
  )
  return shuffle(['white', ...pool] as DogVariant[])
}

function DogSVG({ variant }: { variant: DogVariant }) {
  const { body, ear, outline, spots } = DOG_PALETTE[variant]
  const eyeFill = variant === 'black' ? '#6B7280' : '#1a1a1a'
  return (
    <svg viewBox="0 0 80 90" width="100%" height="100%" aria-hidden>
      {/* Tail */}
      <path d="M57 60 Q69 46 62 33" stroke={body} strokeWidth="8" fill="none" strokeLinecap="round"/>
      <path d="M57 60 Q69 46 62 33" stroke={outline} strokeWidth="8.5" fill="none" strokeLinecap="round" opacity="0.3"/>
      {/* Body */}
      <ellipse cx="38" cy="66" rx="24" ry="18" fill={body} stroke={outline} strokeWidth="1"/>
      {/* Ears (behind head) */}
      <ellipse cx="20" cy="39" rx="9" ry="15" fill={ear} stroke={outline} strokeWidth="0.8" transform="rotate(-18 20 39)"/>
      <ellipse cx="56" cy="39" rx="9" ry="15" fill={ear} stroke={outline} strokeWidth="0.8" transform="rotate(18 56 39)"/>
      {/* Head */}
      <circle cx="38" cy="29" r="22" fill={body} stroke={outline} strokeWidth="1"/>
      {/* Eyes */}
      <circle cx="29" cy="25" r="5" fill="white"/>
      <circle cx="47" cy="25" r="5" fill="white"/>
      <circle cx="30" cy="25" r="3" fill={eyeFill}/>
      <circle cx="48" cy="25" r="3" fill={eyeFill}/>
      <circle cx="31" cy="24" r="1" fill="white"/>
      <circle cx="49" cy="24" r="1" fill="white"/>
      {/* Nose */}
      <ellipse cx="38" cy="35" rx="5" ry="3.5" fill="#2d2d2d"/>
      {/* Mouth */}
      <path d="M33 39 Q38 44 43 39" stroke="#2d2d2d" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Front legs */}
      <rect x="21" y="77" width="11" height="13" rx="5.5" fill={body} stroke={outline} strokeWidth="0.8"/>
      <rect x="44" y="77" width="11" height="13" rx="5.5" fill={body} stroke={outline} strokeWidth="0.8"/>
      {/* Spots for spotted dog */}
      {spots && <>
        <circle cx="33" cy="62" r="5" fill="#6b3a1f" opacity="0.6"/>
        <circle cx="47" cy="70" r="4" fill="#6b3a1f" opacity="0.6"/>
        <circle cx="26" cy="71" r="3.5" fill="#6b3a1f" opacity="0.6"/>
        <circle cx="33" cy="23" r="4" fill="#6b3a1f" opacity="0.5"/>
        <circle cx="47" cy="31" r="3" fill="#6b3a1f" opacity="0.45"/>
      </>}
    </svg>
  )
}

export default function DogGame() {
  const router = useRouter()
  const [allRoundDogs] = useState<DogVariant[][]>(() => ROUNDS.map(r => makeDogs(r.count)))
  const [roundIdx, setRoundIdx] = useState(0)
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro')
  const [wrongIdx, setWrongIdx] = useState<number | null>(null)
  const [wrongCount, setWrongCount] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [scores, setScores] = useState<number[]>([])

  const currentRound = ROUNDS[roundIdx]
  const currentDogs = allRoundDogs[roundIdx]
  const whiteIdx = currentDogs.indexOf('white')

  const handleTap = useCallback((idx: number) => {
    if (submitted) return
    if (currentDogs[idx] === 'white') {
      const roundScore = wrongCount === 0 ? 100 : 50
      setScores(prev => [...prev, roundScore])
      setSubmitted(true)
    } else {
      setWrongIdx(idx)
      setWrongCount(c => c + 1)
      setTimeout(() => setWrongIdx(null), 600)
    }
  }, [submitted, currentDogs, wrongCount])

  function handleCantFind() {
    if (submitted) return
    setScores(prev => [...prev, 0])
    setSubmitted(true)
  }

  function nextRound() {
    if (roundIdx + 1 >= ROUNDS.length) {
      setPhase('done')
    } else {
      setRoundIdx(r => r + 1)
      setWrongCount(0)
      setSubmitted(false)
    }
  }

  const header = (
    <div className="flex items-center gap-3 mb-4">
      <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
      <h1 className="text-xl font-bold text-slate-800">找白狗</h1>
      {phase === 'play' && (
        <span className="ml-auto text-sm text-slate-400">{currentRound.label} · 第 {roundIdx + 1}/{ROUNDS.length} 关</span>
      )}
    </div>
  )

  if (phase === 'intro') {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
        {header}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <p className="text-slate-700 text-lg font-semibold mb-3">找出唯一的白色小狗！</p>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-green-50 p-1 flex-shrink-0 border-4 border-emerald-400">
              <DogSVG variant="white"/>
            </div>
            <div>
              <p className="text-slate-600 text-base">在各种颜色的狗狗中，找出这只<b className="text-slate-800">纯白色的狗狗</b>并点击它</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(['black','brown','golden','gray','spotted','white'] as DogVariant[]).map(v => (
              <div key={v} className={`rounded-xl p-1 ${v === 'white' ? 'bg-emerald-50 border-2 border-emerald-300' : 'bg-slate-50'}`}>
                <DogSVG variant={v}/>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => setPhase('play')}
          className="w-full bg-yellow-400 text-slate-800 text-xl font-bold py-5 rounded-2xl"
        >
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
          <p className="text-slate-500 text-base mb-2">全部完成！平均得分</p>
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
          <button
            onClick={() => { addSession('dog', '找白狗', avg); router.push('/games') }}
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
      {header}

      {submitted ? (
        <div className={`text-center rounded-xl py-2 mb-3 text-base font-semibold ${
          scores[scores.length - 1] > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
        }`}>
          {scores[scores.length - 1] === 100 ? '一次找到！满分！' :
           scores[scores.length - 1] === 50 ? '找到了！' : '没找到，白狗高亮显示了'}
        </div>
      ) : (
        <p className="text-center text-slate-500 text-sm mb-3">
          找出唯一的<span className="font-semibold text-slate-700">白色小狗</span>并点击它
          {wrongCount > 0 && <span className="text-amber-500 ml-2">已点错 {wrongCount} 次</span>}
        </p>
      )}

      {/* Background strip */}
      <div className="relative rounded-2xl overflow-hidden mb-4" style={{ background: 'linear-gradient(180deg, #bfdbfe 0%, #bfdbfe 30%, #bbf7d0 30%, #86efac 100%)' }}>
        {/* Simple trees decoration */}
        <svg viewBox="0 0 340 28" width="100%" aria-hidden>
          {[20,70,130,200,260,310].map(x => (
            <g key={x}>
              <polygon points={`${x},2 ${x-10},22 ${x+10},22`} fill="#16a34a" opacity="0.7"/>
              <rect x={x-3} y={22} width="6" height="6" fill="#92400e" opacity="0.6"/>
            </g>
          ))}
        </svg>

        <div
          className="p-3 pt-1"
          style={{ display: 'grid', gridTemplateColumns: `repeat(${currentRound.cols}, 1fr)`, gap: '8px' }}
        >
          {currentDogs.map((variant, idx) => {
            const isWrong = wrongIdx === idx
            const isWhiteAndSubmitted = submitted && variant === 'white'
            const isCorrectAndFound = submitted && scores[scores.length - 1] > 0 && variant === 'white'

            return (
              <button
                key={idx}
                onClick={() => handleTap(idx)}
                disabled={submitted}
                className={`aspect-square rounded-2xl p-1.5 transition-all active:scale-95 ${
                  isWhiteAndSubmitted && isCorrectAndFound
                    ? 'bg-emerald-100 border-4 border-emerald-400 scale-105'
                    : isWhiteAndSubmitted
                    ? 'bg-emerald-50 border-4 border-emerald-400'
                    : isWrong
                    ? 'bg-red-100 border-2 border-red-400 scale-95'
                    : submitted
                    ? 'bg-white/40 opacity-40'
                    : 'bg-white/80 shadow-sm'
                }`}
              >
                <DogSVG variant={variant}/>
              </button>
            )
          })}
        </div>
      </div>

      {submitted ? (
        <button
          onClick={nextRound}
          className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl"
        >
          {roundIdx + 1 < ROUNDS.length ? '下一关' : '查看结果'}
        </button>
      ) : (
        <button
          onClick={handleCantFind}
          className="w-full bg-slate-100 text-slate-500 text-base font-medium py-3 rounded-xl"
        >
          找不到白狗
        </button>
      )}
    </div>
  )
}
