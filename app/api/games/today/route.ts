export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToday } from '@/lib/utils'

export async function GET() {
  const date = getToday()
  const sessions = await prisma.gameSession.findMany({
    where: { date, completed: true },
    orderBy: { createdAt: 'asc' },
  })
  const progress = await prisma.dailyProgress.findUnique({ where: { date } })
  return NextResponse.json({ sessions, progress })
}
