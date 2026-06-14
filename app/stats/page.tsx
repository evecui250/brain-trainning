'use client'

import { useEffect, useState } from 'react'
import NavBar from '@/components/NavBar'
import { GAME_LIST, DAILY_GOAL } from '@/lib/utils'
import { GameIcon } from '@/components/GameIcons'
import { getStats, type Session } from '@/lib/storage'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

type StatsData = ReturnType<typeof getStats>

function fmtDate(d: string) {
  const [, m, day] = d.split('-')
  return `${parseInt(m)}/${parseInt(day)}`
}

function fmtFull(d: string) {
  const [y, m, day] = d.split('-')
  return `${y}年${parseInt(m)}月${parseInt(day)}日`
}

function scoreLabel(score: number): string {
  return `${score} 分`
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    setStats(getStats())
  }, [])

  if (!stats) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center text-gray-500 text-xl mt-16">
        <NavBar />加载中...
      </div>
    )
  }

  const { sessions, dailyProgress, totalSessions, streak } = stats
  const goalDays = dailyProgress.filter(p => p.goalReached).length

  const chartData = dailyProgress
    .slice(-14)
    .map(p => ({ date: fmtDate(p.date), games: p.gamesCompleted }))

  const sessionsByDate = sessions.reduce<Record<string, Session[]>>((acc, s) => {
    ;(acc[s.date] ??= []).push(s)
    return acc
  }, {})
  const sortedDates = Object.keys(sessionsByDate).sort().reverse().slice(0, 30)

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <NavBar />
      <h1 className="text-2xl font-bold text-slate-800 mb-5">训练记录</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-4xl font-bold text-orange-500">{streak}</p>
          <p className="text-gray-500 text-lg mt-1">连续打卡天数</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-4xl font-bold text-blue-500">{totalSessions}</p>
          <p className="text-gray-500 text-lg mt-1">累计训练次数</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center col-span-2">
          <p className="text-4xl font-bold text-green-500">{goalDays}</p>
          <p className="text-gray-500 text-lg mt-1">完成每日目标天数</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">近14天每日训练数</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 8]} ticks={[0, 2, 4, 5, 8]} tick={{ fontSize: 12 }} />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip formatter={(val: any) => [`${val} 个`, '游戏数']} />
              <Bar dataKey="games" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-sm text-gray-400 mt-1">满{DAILY_GOAL}个为完成目标</p>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-800 mb-3">每日详细记录</h2>

      {sortedDates.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xl shadow-sm">
          <p>还没有训练记录</p>
          <p className="text-base mt-1">完成游戏后这里会显示详细记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => {
            const daySessions = sessionsByDate[date]
            const prog = dailyProgress.find(p => p.date === date)
            // Highest score per game type for this day
            const best = Object.values(
              daySessions.reduce<Record<string, Session>>((acc, s) => {
                if (!acc[s.gameType] || s.score > acc[s.gameType].score) acc[s.gameType] = s
                return acc
              }, {})
            )
            return (
              <div key={date} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className={`px-4 py-3 flex items-center justify-between ${prog?.goalReached ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                  <span className="text-base font-semibold text-slate-700">{fmtFull(date)}</span>
                  {prog?.goalReached
                    ? <span className="text-emerald-600 font-semibold text-sm">目标达成</span>
                    : <span className="text-slate-400 text-sm">{best.length}/{DAILY_GOAL} 个游戏</span>
                  }
                </div>
                <div className="divide-y divide-slate-50">
                  {best.map((s, i) => {
                    const def = GAME_LIST.find(g => g.type === s.gameType)
                    return (
                      <div key={i} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${def?.bg ?? 'bg-slate-100'}`}>
                            <GameIcon type={s.gameType} className="w-5 h-5" />
                          </div>
                          <span className="text-base text-slate-700">{s.gameName}</span>
                        </div>
                        <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                          {scoreLabel(s.score)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
