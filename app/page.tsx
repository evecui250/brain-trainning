'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDate, getWeekday, DAILY_GOAL, GAME_LIST } from '@/lib/utils'
import { getTodayData, getStats, type Session } from '@/lib/storage'
import NavBar from '@/components/NavBar'
import { GameIcon } from '@/components/GameIcons'

type HomeData = { sessions: Session[]; gamesCompleted: number; goalReached: boolean; streak: number }

export default function Home() {
  const [data, setData] = useState<HomeData | null>(null)

  useEffect(() => {
    const { sessions, gamesCompleted, goalReached } = getTodayData()
    const { streak } = getStats()
    setData({ sessions, gamesCompleted, goalReached, streak })
  }, [])

  const today = new Date()
  const yy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const dateStr = `${yy}-${mm}-${dd}`

  const gamesCompleted = data?.gamesCompleted ?? 0
  const goalReached = data?.goalReached ?? false
  const sessions = data?.sessions ?? []
  const streak = data?.streak ?? 0
  const pct = Math.min(gamesCompleted / DAILY_GOAL * 100, 100)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <NavBar />

      {/* Date */}
      <p className="text-slate-400 text-base mb-1">{formatDate(dateStr)} · {getWeekday()}</p>
      <h1 className="text-2xl font-bold text-slate-800 mb-5">你好</h1>

      {/* Streak */}
      <div className="bg-indigo-600 rounded-2xl px-5 py-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-indigo-200 text-sm font-medium">连续打卡</p>
          <p className="text-white text-3xl font-bold">{streak} 天</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">{streak > 0 ? '★' : '○'}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-700 font-semibold text-lg">今日训练</p>
          <p className="text-indigo-600 font-bold text-xl">{gamesCompleted}/{DAILY_GOAL}</p>
        </div>
        <div className="bg-slate-100 rounded-full h-3 mb-3">
          <div
            className="bg-indigo-500 rounded-full h-3 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {goalReached ? (
          <p className="text-emerald-600 font-semibold">已完成今日目标</p>
        ) : (
          <p className="text-slate-500">还需 {DAILY_GOAL - gamesCompleted} 个游戏</p>
        )}
        {sessions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {sessions.map((s, i) => {
              const g = GAME_LIST.find(g => g.type === s.gameType)
              return (
                <span key={i} className={`${g?.bg ?? 'bg-slate-100'} flex items-center gap-1.5 px-2.5 py-1 rounded-full`}>
                  <GameIcon type={s.gameType} className="w-4 h-4 shrink-0" />
                  <span className={`${g?.fg ?? 'text-slate-600'} text-sm font-medium`}>{g?.name ?? s.gameName}</span>
                </span>
              )
            })}
          </div>
        )}
      </div>

      <Link
        href="/games"
        className="block w-full text-center bg-indigo-600 text-white text-lg font-bold py-4 rounded-2xl shadow-sm"
      >
        开始训练
      </Link>
    </div>
  )
}
