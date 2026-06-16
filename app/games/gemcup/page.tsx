'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { addSession } from '@/lib/storage'

const ROUND_CONFIGS = [
  { swaps: 5,  swapMs: 700, label: '简单' },
  { swaps: 9,  swapMs: 430, label: '中等' },
  { swaps: 14, swapMs: 260, label: '困难' },
]
const TOTAL_ROUNDS = 3

type Phase = 'intro' | 'reveal' | 'shuffling' | 'choose' | 'result' | 'done'

// Cup visual positions (left %) for slots 0,1,2
const SLOT_LEFT = ['6%', '36%', '66%']

function CupSVG({ lifted, hasGem, revealed }: { lifted: boolean; hasGem: boolean; revealed: boolean }) {
  return (
    <div style={{ position: 'relative', width: 80, height: 100 }}>
      {/* Gem beneath cup */}
      {hasGem && (revealed || lifted) && (
        <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)' }}>
          <svg viewBox="0 0 36 30" width="36" height="30">
            <polygon points="18,1 30,12 18,29 6,12" fill="#60A5FA" stroke="#2563EB" strokeWidth="1.5"/>
            <polygon points="18,1 30,12 18,14 6,12" fill="#93C5FD"/>
            <polygon points="18,14 30,12 18,29" fill="#3B82F6" opacity="0.6"/>
          </svg>
        </div>
      )}
      {/* Cup */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, transform: `translateY(${lifted ? -40 : 0}px)`, transition: 'transform 0.35s ease' }}>
        <svg viewBox="0 0 80 90" width="80" height="90">
          {/* Cup body */}
          <path d="M8,88 L18,10 L62,10 L72,88 Z" fill="#D97706" stroke="#B45309" strokeWidth="1.5"/>
          {/* Rim at top (open end) */}
          <ellipse cx="40" cy="10" rx="22" ry="7" fill="#B45309"/>
          {/* Base at bottom */}
          <ellipse cx="40" cy="88" rx="32" ry="9" fill="#92400E"/>
          {/* Highlight */}
          <path d="M22 20 L26 80" stroke="#FDE68A" strokeWidth="4" opacity="0.35" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  )
}

export default function GemCupGame() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('intro')
  const [roundIdx, setRoundIdx] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  // slots[i] = current slot (0,1,2) of cup i
  const [slots, setSlots] = useState([0, 1, 2])
  const [gemCup, setGemCup] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const shuffling = useRef(false)

  function slotOfCup(cupIdx: number, slts: number[]) {
    return slts[cupIdx]
  }
  function cupAtSlot(slot: number, slts: number[]) {
    return slts.findIndex(s => s === slot)
  }

  async function runShuffle(swaps: number, swapMs: number) {
    shuffling.current = true
    setPhase('shuffling')
    let currentSlots = [0, 1, 2]
    setSlots([...currentSlots])

    for (let i = 0; i < swaps; i++) {
      await new Promise<void>(r => setTimeout(r, swapMs))
      // Pick two distinct cups to swap
      const a = Math.floor(Math.random() * 3)
      let b = Math.floor(Math.random() * 2)
      if (b >= a) b++
      ;[currentSlots[a], currentSlots[b]] = [currentSlots[b], currentSlots[a]]
      setSlots([...currentSlots])
    }

    await new Promise<void>(r => setTimeout(r, swapMs))
    shuffling.current = false
    setPhase('choose')
  }

  function startRound() {
    const gem = Math.floor(Math.random() * 3)
    setGemCup(gem)
    setSlots([0, 1, 2])
    setChosen(null)
    setPhase('reveal')
    setTimeout(() => {
      const cfg = ROUND_CONFIGS[Math.min(roundIdx, ROUND_CONFIGS.length - 1)]
      runShuffle(cfg.swaps, cfg.swapMs)
    }, 1600)
  }

  function handleChoose(slot: number) {
    if (phase !== 'choose') return
    const cup = cupAtSlot(slot, slots)
    setChosen(cup)
    const correct = cup === gemCup
    setScores(p => [...p, correct ? 100 : 0])
    setPhase('result')
    setTimeout(() => {
      if (roundIdx + 1 >= TOTAL_ROUNDS) setPhase('done')
      else { setRoundIdx(r => r + 1); startRound() }
    }, 2000)
  }

  const header = (
    <div className="flex items-center gap-3 mb-5">
      <button onClick={() => router.push('/games')} className="text-slate-400 text-2xl font-light w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100">‹</button>
      <h1 className="text-xl font-bold text-slate-800">找宝石</h1>
      {phase !== 'intro' && phase !== 'done' && (
        <span className="ml-auto text-sm text-slate-400">{ROUND_CONFIGS[Math.min(roundIdx, 2)].label} · {roundIdx + 1}/{TOTAL_ROUNDS}</span>
      )}
    </div>
  )

  if (phase === 'intro') {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
        {header}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <p className="text-slate-700 text-lg font-semibold mb-3">盯住藏宝石的杯子！</p>
          <div className="flex justify-center gap-6 mb-4">
            <CupSVG lifted={false} hasGem={false} revealed={false}/>
            <CupSVG lifted={true} hasGem={true} revealed={true}/>
            <CupSVG lifted={false} hasGem={false} revealed={false}/>
          </div>
          <p className="text-slate-500 text-center">三个杯子会快速移动</p>
          <p className="text-slate-500 text-center">记住宝石在哪个杯子里，最后选出来</p>
        </div>
        <button onClick={startRound} className="w-full bg-fuchsia-500 text-white text-xl font-bold py-5 rounded-2xl">
          开始游戏
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
          <p className="text-slate-400 mb-2">全部完成！得分</p>
          <p className="text-7xl font-bold text-fuchsia-500 mb-1">{avg}</p>
          <p className="text-slate-400 text-xl mb-6">分</p>
          <div className="w-full bg-white rounded-2xl p-4 shadow-sm mb-8">
            {scores.map((s, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-slate-500">{ROUND_CONFIGS[i]?.label ?? `第${i+1}关`}</span>
                <span className={`font-semibold ${s === 100 ? 'text-emerald-600' : 'text-red-400'}`}>{s === 100 ? '猜对了！' : '猜错了'}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { addSession('gemcup', '找宝石', avg); router.push('/games') }}
            className="w-full bg-indigo-600 text-white text-lg font-semibold py-4 rounded-xl">
            记录并继续
          </button>
        </div>
      </div>
    )
  }

  const isResult = phase === 'result'
  const correctSlot = slots[gemCup]
  const chosenSlot = chosen !== null ? slots[chosen] : null

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      {header}

      <div className="text-center mb-6">
        {phase === 'reveal' && <p className="text-fuchsia-600 font-semibold text-lg">记住宝石在这个杯子里！</p>}
        {phase === 'shuffling' && <p className="text-slate-500 text-lg">认真跟踪！</p>}
        {phase === 'choose' && <p className="text-indigo-600 font-semibold text-lg">宝石在哪个杯子里？点击选择</p>}
        {phase === 'result' && (
          <p className={`font-semibold text-lg ${scores[scores.length - 1] === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
            {scores[scores.length - 1] === 100 ? '猜对了！' : '猜错了！'}
          </p>
        )}
      </div>

      {/* Cup play area */}
      <div className="relative mx-auto" style={{ height: 160, maxWidth: 340 }}>
        {/* Table */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-amber-800 rounded-xl"/>
        {/* Cups */}
        {[0, 1, 2].map(cupIdx => {
          const slot = slots[cupIdx]
          const lifted = (isResult && (cupIdx === gemCup || cupIdx === chosen)) || (phase === 'reveal' && cupIdx === gemCup)
          const revealed = isResult
          return (
            <div
              key={cupIdx}
              onClick={() => handleChoose(slot)}
              style={{
                position: 'absolute',
                left: SLOT_LEFT[slot],
                bottom: 18,
                transition: `left ${ROUND_CONFIGS[Math.min(roundIdx, 2)].swapMs * 0.9}ms ease-in-out`,
                cursor: phase === 'choose' ? 'pointer' : 'default',
              }}
            >
              <CupSVG lifted={lifted} hasGem={cupIdx === gemCup} revealed={revealed || phase === 'reveal'}/>
              {/* Chosen indicator */}
              {isResult && cupIdx === chosen && (
                <div className={`text-center text-xs font-bold mt-1 ${scores[scores.length - 1] === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {cupIdx === gemCup ? '正确！' : '这里没有'}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 text-center">
        {phase === 'reveal' && <p className="text-slate-400 text-sm">请记住…</p>}
        {phase === 'shuffling' && <p className="text-slate-400 text-sm">盯紧了！</p>}
        {phase === 'choose' && (
          <div className="flex justify-around">
            {[0, 1, 2].map(slot => (
              <button key={slot} onClick={() => handleChoose(slot)}
                className="w-20 py-3 bg-fuchsia-100 text-fuchsia-700 font-semibold rounded-xl active:scale-95 transition-all">
                第{slot + 1}个
              </button>
            ))}
          </div>
        )}
        {phase === 'result' && <p className="text-slate-400 text-sm">下一轮即将开始…</p>}
      </div>
    </div>
  )
}
