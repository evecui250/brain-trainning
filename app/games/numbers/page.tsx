'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'

const TOTAL = 20

function shuffle(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i + 1)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function NumbersGame() {
  const router = useRouter()
  // Grid order: fixed random positions, but values are shuffled
  const [order] = useState(() => shuffle(TOTAL))
  const [next, setNext] = useState(1)
  const [done, setDone] = useState<Set<number>>(new Set())
  const [wrong, setWrong] = useState<number | null>(null)
  const [finished, setFinished] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [saving, setSaving] = useState(false)
  const startRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function handleTap(num: number) {
    if (done.has(num)) return
    if (num === next) {
      const nextDone = new Set(done)
      nextDone.add(num)
      setDone(nextDone)
      if (num === TOTAL) {
        if (timerRef.current) clearInterval(timerRef.current)
        setFinished(true)
      } else {
        setNext(num + 1)
      }
    } else {
      // Wrong tap — flash red briefly
      setWrong(num)
      setTimeout(() => setWrong(null), 600)
    }
  }

  async function handleComplete() {
    setSaving(true)
    const score = Math.max(100 - Math.floor(elapsed / 3), 10)
    await fetch('/api/games/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameType: 'numbers', gameName: '数字接龙', score }),
    })
    router.push('/games')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <NavBar />
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push('/games')} className="text-3xl">←</button>
        <h1 className="text-2xl font-bold">🔢 数字接龙</h1>
      </div>
      <p className="text-gray-500 text-lg mb-2">从 1 开始，按顺序找到并点击每个数字！</p>

      <div className="flex justify-between text-lg font-semibold mb-4 bg-white rounded-xl p-3 shadow-sm">
        <span>已完成：<b className="text-green-600">{done.size}</b> / {TOTAL}</span>
        <span>用时：{elapsed} 秒</span>
      </div>

      {/* 4 × 5 grid of shuffled numbers — no highlighting */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {order.map(num => {
          const isDone = done.has(num)
          const isWrong = wrong === num
          return (
            <button
              key={num}
              onClick={() => handleTap(num)}
              disabled={isDone}
              className={`h-16 rounded-2xl text-2xl font-bold transition-all select-none ${
                isDone
                  ? 'bg-green-100 text-green-500 opacity-50 line-through'
                  : isWrong
                  ? 'bg-red-200 text-red-600 scale-95'
                  : 'bg-white text-gray-800 shadow-sm active:scale-95'
              }`}
            >
              {isDone ? '✓' : num}
            </button>
          )
        })}
      </div>

      {finished && (
        <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-5 text-center">
          <p className="text-4xl mb-2">🎉</p>
          <p className="text-2xl font-bold text-green-700 mb-1">全部找到了！</p>
          <p className="text-lg text-gray-600 mb-4">用时 {elapsed} 秒</p>
          <button onClick={handleComplete} disabled={saving}
            className="w-full bg-green-500 text-white text-xl font-bold py-4 rounded-xl">
            {saving ? '保存中...' : '记录并继续 →'}
          </button>
        </div>
      )}
    </div>
  )
}
