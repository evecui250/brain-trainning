export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getToday, formatDate, getWeekday, DAILY_GOAL, GAME_LIST } from '@/lib/utils'
import NavBar from '@/components/NavBar'

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const today = getToday()
  const sorted = [...new Set(dates)].sort().reverse()
  let streak = 0
  let current = today
  for (const date of sorted) {
    if (date === current) {
      streak++
      const d = new Date(current + 'T00:00:00')
      d.setDate(d.getDate() - 1)
      current = d.toISOString().split('T')[0]
    } else break
  }
  return streak
}

async function getTodayData() {
  const date = getToday()
  try {
    const [progress, sessions, allDates] = await Promise.all([
      prisma.dailyProgress.findUnique({ where: { date } }),
      prisma.gameSession.findMany({ where: { date, completed: true }, orderBy: { createdAt: 'asc' } }),
      prisma.dailyProgress.findMany({ orderBy: { date: 'asc' }, select: { date: true } }),
    ])
    const streak = calcStreak(allDates.map(d => d.date))
    return { progress, sessions, streak, error: false }
  } catch {
    return { progress: null, sessions: [], streak: 0, error: true }
  }
}

export default async function Home() {
  const { progress, sessions, streak, error } = await getTodayData()
  const gamesCompleted = progress?.gamesCompleted ?? 0
  const goalReached = progress?.goalReached ?? false
  const today = getToday()

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <NavBar />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-center">
          <p className="text-red-600 text-lg font-semibold">⚠️ 数据库连接失败</p>
          <p className="text-red-500 text-base mt-1">请检查 Vercel 环境变量 DATABASE_URL 是否正确设置</p>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <p className="text-gray-500 text-lg">{formatDate(today)} · {getWeekday()}</p>
        <h1 className="text-3xl font-bold text-gray-800 mt-1">你好！👋</h1>
        <p className="text-gray-500 mt-1 text-lg">坚持训练，让大脑保持活力</p>
      </div>

      {/* Streak */}
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-5 mb-4 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-5xl">🔥</span>
          <div>
            <p className="text-lg opacity-90">连续打卡</p>
            <p className="text-4xl font-bold">{streak} 天</p>
          </div>
        </div>
      </div>

      {/* Today Progress */}
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
            {sessions.map(s => {
              const game = GAME_LIST.find(g => g.type === s.gameType)
              return (
                <span key={s.id} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-base">
                  {game?.icon} {game?.name}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Start Training */}
      <Link
        href="/games"
        className="block w-full text-center bg-blue-600 text-white text-xl font-bold py-5 rounded-2xl shadow-md"
      >
        🎮 开始训练游戏
      </Link>
    </div>
  )
}
