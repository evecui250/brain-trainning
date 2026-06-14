export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToday } from '@/lib/utils'

export async function GET() {
  const quizResults = await prisma.quizResult.findMany({
    orderBy: { date: 'asc' },
  })

  const dailyProgress = await prisma.dailyProgress.findMany({
    orderBy: { date: 'asc' },
  })

  const totalSessions = await prisma.gameSession.count({ where: { completed: true } })

  const streak = calcStreak(dailyProgress.map(p => p.date))

  return NextResponse.json({ quizResults, dailyProgress, totalSessions, streak })
}

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
    } else {
      break
    }
  }
  return streak
}
