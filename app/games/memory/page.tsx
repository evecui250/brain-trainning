'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addSession } from '@/lib/storage'

// ─── SVG card faces ────────────────────────────────────────────────────────

function SunSVG() {
  return (
    <svg viewBox="0 0 60 60" width="52" height="52">
      <circle cx="30" cy="30" r="11" fill="#F59E0B" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
        const r = (a * Math.PI) / 180
        return (
          <line key={a}
            x1={30 + 14 * Math.cos(r)} y1={30 + 14 * Math.sin(r)}
            x2={30 + 22 * Math.cos(r)} y2={30 + 22 * Math.sin(r)}
            stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
        )
      })}
    </svg>
  )
}

function MoonSVG() {
  return (
    <svg viewBox="0 0 60 60" width="52" height="52">
      <circle cx="28" cy="30" r="20" fill="#818CF8" />
      <circle cx="37" cy="24" r="17" fill="#EDE9FE" />
      <circle cx="46" cy="12" r="2.5" fill="#818CF8" />
      <circle cx="52" cy="22" r="1.8" fill="#818CF8" />
      <circle cx="49" cy="32" r="1.5" fill="#818CF8" />
    </svg>
  )
}

function FlowerSVG() {
  const petals = [0, 72, 144, 216, 288].map(a => ({
    cx: 30 + 13 * Math.sin((a * Math.PI) / 180),
    cy: 30 - 13 * Math.cos((a * Math.PI) / 180),
  }))
  return (
    <svg viewBox="0 0 60 60" width="52" height="52">
      {petals.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r="10" fill="#F472B6" />
      ))}
      <circle cx="30" cy="30" r="9" fill="#FDE68A" />
      <circle cx="30" cy="30" r="4" fill="#F59E0B" />
    </svg>
  )
}

function HeartSVG() {
  return (
    <svg viewBox="0 0 60 60" width="52" height="52">
      <path
        d="M30,48 C12,38 6,28 6,21 C6,11 14,6 22,6 C27,6 30,11 30,15 C30,11 33,6 38,6 C46,6 54,11 54,21 C54,28 48,38 30,48 Z"
        fill="#EF4444"
      />
    </svg>
  )
}

function FishSVG() {
  return (
    <svg viewBox="0 0 60 60" width="52" height="52">
      <polygon points="14,16 14,44 4,30" fill="#0EA5E9" />
      <ellipse cx="34" cy="30" rx="18" ry="12" fill="#38BDF8" />
      <polygon points="28,18 42,18 35,24" fill="#0EA5E9" />
      <circle cx="44" cy="27" r="4" fill="white" />
      <circle cx="45" cy="27" r="2.2" fill="#0F172A" />
      <circle cx="46" cy="26" r="0.8" fill="white" />
      <path d="M 50 31 Q 53 33 50 35" fill="none" stroke="#0369A1" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function StarSVG() {
  function pts(cx: number, cy: number, outer: number, inner: number): string {
    return Array.from({ length: 10 }, (_, i) => {
      const angle = (i * Math.PI) / 5 - Math.PI / 2
      const r = i % 2 === 0 ? outer : inner
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
    }).join(' ')
  }
  return (
    <svg viewBox="0 0 60 60" width="52" height="52">
      <polygon points={pts(30, 30, 26, 11)} fill="#FBBF24" />
      <polygon points={pts(30, 30, 20, 8)} fill="#FDE68A" opacity="0.6" />
    </svg>
  )
}

// ─── Card definitions ──────────────────────────────────────────────────────

type CardDef = {
  key: string
  label: string
  bg: string
  render: () => React.ReactNode
}

const CARD_DEFS: CardDef[] = [
  { key: 'sun',    label: '太阳', bg: '#FEF9C3', render: () => <SunSVG /> },
  { key: 'moon',   label: '月亮', bg: '#EDE9FE', render: () => <MoonSVG /> },
  { key: 'flower', label: '花朵', bg: '#FCE7F3', render: () => <FlowerSVG /> },
  { key: 'heart',  label: '爱心', bg: '#FEE2E2', render: () => <HeartSVG /> },
  { key: 'fish',   label: '鱼儿', bg: '#E0F2FE', render: () => <FishSVG /> },
  { key: 'star',   label: '星星', bg: '#FFFBEB', render: () => <StarSVG /> },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Card = { id: number; defKey: string; flipped: boolean; matched: boolean }

function makeCards(): Card[] {
  const pairs = shuffle([...CARD_DEFS, ...CARD_DEFS])
  return pairs.map((def, i) => ({ id: i, defKey: def.key, flipped: false, matched: false }))
}

export default function MemoryGame() {
  const router = useRouter()
  const [cards, setCards] = useState<Card[]>(makeCards)
  const [selected, setSelected] = useState<number[]>([])
  const [attempts, setAttempts] = useState(0)
  const [matched, setMatched] = useState(0)
  const [done, setDone] = useState(false)
  const [disabled, setDisabled] = useState(false)

  const handleFlip = useCallback((id: number) => {
    if (disabled) return
    setCards(prev => {
      const card = prev[id]
      if (card.flipped || card.matched) return prev
      return prev.map(c => c.id === id ? { ...c, flipped: true } : c)
    })
    setSelected(prev => {
      if (prev.length === 0) return [id]
      if (prev.length === 1 && prev[0] !== id) return [...prev, id]
      return prev
    })
  }, [disabled])

  useEffect(() => {
    if (selected.length !== 2) return
    const [a, b] = selected
    setAttempts(n => n + 1)
    setDisabled(true)
    if (cards[a].defKey === cards[b].defKey) {
      setCards(prev => prev.map(c =>
        c.id === a || c.id === b ? { ...c, matched: true } : c
      ))
      setMatched(n => {
        const next = n + 1
        if (next === CARD_DEFS.length) setDone(true)
        return next
      })
      setSelected([])
      setDisabled(false)
    } else {
      setTimeout(() => {
        setCards(prev => prev.map(c =>
          c.id === a || c.id === b ? { ...c, flipped: false } : c
        ))
        setSelected([])
        setDisabled(false)
      }, 1100)
    }
  }, [selected])

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 min-h-screen flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
          <h1 className="text-xl font-bold text-slate-800">翻牌记忆</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-slate-500 text-base mb-2">全部配对！翻牌</p>
          <p className="text-7xl font-bold text-blue-500 mb-1">{attempts}</p>
          <p className="text-slate-400 text-xl mb-8">次</p>
          <button
            onClick={() => { addSession('memory', '翻牌记忆', attempts); router.push('/games') }}
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
          <h1 className="text-xl font-bold text-slate-800">翻牌记忆</h1>
        </div>
        <span className="text-slate-400 text-sm">{matched}/{CARD_DEFS.length} 对</span>
      </div>

      <p className="text-slate-500 text-sm mb-4 text-center">翻开两张牌，找出所有相同的图案</p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {cards.map(card => {
          const def = CARD_DEFS.find(d => d.key === card.defKey)!
          const isVisible = card.flipped || card.matched

          return (
            <button
              key={card.id}
              onClick={() => handleFlip(card.id)}
              disabled={card.matched || card.flipped}
              style={isVisible ? { backgroundColor: def.bg } : {}}
              className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm transition-all duration-300 ${
                card.matched
                  ? 'border-2 border-emerald-300 opacity-70'
                  : isVisible
                  ? 'border-2 border-indigo-200 scale-105'
                  : 'bg-indigo-500'
              }`}
            >
              {isVisible ? (
                <>
                  {def.render()}
                  <span className="text-xs font-semibold text-slate-600">{def.label}</span>
                  {card.matched && (
                    <span className="absolute top-1 right-2 text-emerald-500 text-base font-bold">✓</span>
                  )}
                </>
              ) : (
                <span className="text-4xl text-white opacity-60 font-light">?</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="text-center text-sm text-slate-400">翻牌次数：{attempts}</div>
    </div>
  )
}
