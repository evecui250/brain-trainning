export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getToday, GAME_LIST, DAILY_GOAL } from '@/lib/utils'
import NavBar from '@/components/NavBar'

export default async function GamesPage() {
  const date = getToday()
  const sessions = await prisma.gameSession.findMany({
    where: { date, completed: true },
  })
  const playedTypes = new Set(sessions.map(s => s.gameType))
  const gamesCompleted = sessions.length
  const goalReached = gamesCompleted >= DAILY_GOAL

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <NavBar />
      <h1 className="text-3xl font-bold text-gray-800 mb-2">训练游戏</h1>
      <p className="text-gray-500 text-lg mb-4">选择你喜欢的游戏，目标完成 5 个</p>

      {/* Progress */}
      <div className="bg-blue-50 rounded-2xl p-4 mb-5 flex items-center gap-4">
        <div className="flex-1 bg-blue-100 rounded-full h-4">
          <div
            className="bg-blue-500 rounded-full h-4"
            style={{ width: `${Math.min((gamesCompleted / DAILY_GOAL) * 100, 100)}%` }}
          />
        </div>
        <span className="text-xl font-bold text-blue-600 whitespace-nowrap">{gamesCompleted}/{DAILY_GOAL}</span>
      </div>

      {goalReached && (
        <div className="bg-green-100 border border-green-300 rounded-2xl p-4 mb-5 text-center">
          <p className="text-2xl">🎉</p>
          <p className="text-green-700 font-bold text-xl">今日训练目标已完成！</p>
          <Link href="/quiz" className="block mt-3 bg-green-500 text-white text-lg font-semibold py-3 rounded-xl">
            去完成每日测试 →
          </Link>
        </div>
      )}

      {/* Game Grid */}
      <div className="grid grid-cols-2 gap-3">
        {GAME_LIST.map(game => {
          const done = playedTypes.has(game.type)
          return (
            <Link
              key={game.type}
              href={`/games/${game.type}`}
              className={`relative bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center gap-2 text-center border-2 transition-all ${
                done ? 'border-green-400 bg-green-50' : 'border-transparent'
              }`}
            >
              {done && (
                <span className="absolute top-2 right-2 text-xl">✅</span>
              )}
              <span className="text-4xl">{game.icon}</span>
              <span className="font-bold text-gray-800 text-lg">{game.name}</span>
              <span className="text-gray-500 text-sm">{game.desc}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
