import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToday, DAILY_GOAL } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { gameType, gameName, score } = body
  const date = getToday()

  await prisma.gameSession.create({
    data: { date, gameType, gameName, completed: true, score: score ?? 0 },
  })

  const todayCount = await prisma.gameSession.count({
    where: { date, completed: true },
  })

  const goalReached = todayCount >= DAILY_GOAL

  await prisma.dailyProgress.upsert({
    where: { date },
    create: { date, gamesCompleted: todayCount, goalReached },
    update: { gamesCompleted: todayCount, goalReached },
  })

  return NextResponse.json({ gamesCompleted: todayCount, goalReached })
}
