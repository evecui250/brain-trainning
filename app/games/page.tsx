'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GAME_LIST, DAILY_GOAL } from '@/lib/utils'
import { getTodayData } from '@/lib/storage'
import NavBar from '@/components/NavBar'

export default function GamesPage() {
  const [done, setDone] = useState<Set<string>>(new Set())
  const [count, setCount] = useState(0)

  useEffect(() => {
    const { sessions, gamesCompleted } = getTodayData()
    setDone(new Set(sessions.map(s => s.gameType)))
    setCount(gamesCompleted)
  }, [])

  const pct = Math.min(count / DAILY_GOAL * 100, 100)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <NavBar />
      <h1 className="text-2xl font-bold text-slate-800 mb-1">训练游戏</h1>
      <p className="text-slate-400 text-sm mb-4">完成 {DAILY_GOAL} 个游戏为今日目标</p>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 bg-slate-100 rounded-full h-2">
          <div className="bg-indigo-500 rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-indigo-600 font-bold text-base whitespace-nowrap">{count}/{DAILY_GOAL}</span>
      </div>

      {/* Game grid */}
      <div className="grid grid-cols-2 gap-3">
        {GAME_LIST.map(game => {
          const completed = done.has(game.type)
          return (
            <Link
              key={game.type}
              href={`/games/${game.type}`}
              className={`bg-white rounded-2xl p-4 shadow-sm border flex flex-col gap-2 transition-all active:scale-[0.98] ${
                completed ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${game.bg} ${game.fg}`}>
                  {game.name[0]}
                </div>
                {completed && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </span>
                )}
              </div>
              <p className="font-bold text-slate-800 text-base">{game.name}</p>
              <p className="text-slate-400 text-xs leading-tight">{game.desc}</p>
            </Link>
          )
        })}
      </div>

      {count >= DAILY_GOAL && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
          <p className="text-emerald-700 font-bold text-lg">今日目标已完成</p>
          <Link href="/stats" className="block mt-2 text-emerald-600 text-base underline">
            查看训练记录
          </Link>
        </div>
      )}
    </div>
  )
}
