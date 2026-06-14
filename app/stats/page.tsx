'use client'

import { useEffect, useState } from 'react'
import NavBar from '@/components/NavBar'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'

type QuizResult = { date: string; score: number; total: number }
type DailyProgress = { date: string; gamesCompleted: number; goalReached: boolean; quizDone: boolean }
type Stats = {
  quizResults: QuizResult[]
  dailyProgress: DailyProgress[]
  totalSessions: number
  streak: number
}

function fmtDate(d: string) {
  const parts = d.split('-')
  return `${parts[1]}/${parts[2]}`
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats)
  }, [])

  if (!stats) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center text-gray-500 text-xl mt-16">
        <NavBar />
        加载中...
      </div>
    )
  }

  const { quizResults, dailyProgress, totalSessions, streak } = stats

  const chartData = (() => {
    const map = new Map<string, { date: string; score: number | null; games: number }>()
    quizResults.forEach(r => {
      map.set(r.date, { date: r.date, score: (r.score / r.total) * 5, games: 0 })
    })
    dailyProgress.forEach(p => {
      const existing = map.get(p.date) ?? { date: p.date, score: null, games: 0 }
      map.set(p.date, { ...existing, games: p.gamesCompleted })
    })
    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map(d => ({ ...d, date: fmtDate(d.date) }))
  })()

  const avgScore = quizResults.length > 0
    ? (quizResults.reduce((s, r) => s + r.score / r.total * 5, 0) / quizResults.length).toFixed(1)
    : '-'

  const goalDays = dailyProgress.filter(p => p.goalReached).length

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <NavBar />
      <h1 className="text-3xl font-bold text-gray-800 mb-5">📊 训练记录</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-4xl font-bold text-orange-500">{streak}</p>
          <p className="text-gray-500 text-lg mt-1">连续打卡天数</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-4xl font-bold text-blue-500">{totalSessions}</p>
          <p className="text-gray-500 text-lg mt-1">累计训练次数</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-4xl font-bold text-green-500">{avgScore}</p>
          <p className="text-gray-500 text-lg mt-1">平均测试得分</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-4xl font-bold text-purple-500">{goalDays}</p>
          <p className="text-gray-500 text-lg mt-1">完成目标天数</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-xl shadow-sm">
          <p className="text-5xl mb-3">📈</p>
          <p>还没有数据</p>
          <p className="text-base mt-1">完成训练和测试后这里将显示趋势图</p>
        </div>
      ) : (
        <>
          {/* Quiz Score Trend */}
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">认知测试得分趋势</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(val: any) => [`${typeof val === 'number' ? val.toFixed(1) : val} 分`, '测试得分']}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#4A90D9"
                  strokeWidth={3}
                  dot={{ fill: '#4A90D9', r: 5 }}
                  connectNulls={false}
                  name="得分"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Games completed per day */}
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">每日训练游戏数</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 8]} ticks={[0, 2, 4, 5, 8]} tick={{ fontSize: 12 }} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(val: any) => [`${val} 个`, '游戏数']} />
                <Bar dataKey="games" fill="#52C41A" radius={[4, 4, 0, 0]} name="游戏数" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent quiz history */}
          {quizResults.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-700 mb-3">近期测试记录</h2>
              <div className="space-y-2">
                {[...quizResults].reverse().slice(0, 7).map(r => (
                  <div key={r.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600 text-lg">{fmtDate(r.date)}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-500 rounded-full h-3"
                          style={{ width: `${(r.score / r.total) * 100}%` }}
                        />
                      </div>
                      <span className={`font-bold text-lg w-14 text-right ${
                        r.score >= 4 ? 'text-green-600' : r.score >= 3 ? 'text-yellow-600' : 'text-red-500'
                      }`}>
                        {r.score}/{r.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
