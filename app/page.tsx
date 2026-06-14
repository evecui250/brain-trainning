'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDate, getWeekday, DAILY_GOAL, GAME_LIST } from '@/lib/utils'
import { getTodayData, getStats, type Session } from '@/lib/storage'
import NavBar from '@/components/NavBar'

type TodayData = { sessions: Session[]; gamesCompleted: number; goalReached: boolean; streak: number }

export default function Home() {
  const [data, setData] = useState<TodayData | null>(null)

  useEffect(() => {
    const { sessions, gamesCompleted, goalReached } = getTodayData()
    const { streak } = getStats()
    setData({ sessions, gamesCompleted, goalReached, streak })
  }, [])

  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const gamesCompleted = data?.gamesCompleted ?? 0
  const goalReached = data?.goalReached ?? false
  const sessions = data?.sessions ?? []
  const streak = data?.streak ?? 0

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <NavBar />

      <div className="mb-6">
        <p className="text-gray-500 text-lg">{formatDate(dateStr)} · {getWeekday()}</p>
        <h1 className="text-3xl font-bold text-gray-800 mt-1">你好！👋</h1>
        <p className="text-gray-500 mt-1 text-lg">坚持训练，让大脑保持活力</p>
      </div>

      <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-5 mb-4 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-5xl">🔥</span>
          <div>
            <p className="text-lg opacity-90">连续打卡</p>
            <p className="text-4xl font-bold">{streak} 天</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">今日训练进度</h2>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1 bg-gray-100 rounded-full h-5">
            <div
              className="bg-blue-500 rounded-full h-5 transition-all"
              style={{ width: `${Math.min((gamesCompleted / DAILY_GOAL) * 100, 100)}%` }}
            />
          </div>
          <span className="text-2xl font-bold text-blue-600 whitespace-nowrap">
            {gamesCompleted} / {DAILY_GOAL}
          </span>
        </div>
        {goalReached ? (
          <p className="text-green-600 font-semibold text-xl">✅ 今日训练已完成！</p>
        ) : (
          <p className="text-gray-500 text-lg">还需完成 <b>{DAILY_GOAL - gamesCompleted}</b> 个游戏</p>
        )}
        {sessions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {sessions.map((s, i) => {
              const game = GAME_LIST.find(g => g.type === s.gameType)
              return (
                <span key={i} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-base">
                  {game?.icon} {game?.name}
                </span>
              )
            })}
          </div>
        )}
      </div>

      <Link
        href="/games"
        className="block w-full text-center bg-blue-600 text-white text-xl font-bold py-5 rounded-2xl shadow-md"
      >
        🎮 开始训练游戏
      </Link>
    </div>
  )
}
