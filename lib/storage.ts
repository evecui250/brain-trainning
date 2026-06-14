import { DAILY_GOAL } from './utils'

export type Session = {
  date: string
  gameType: string
  gameName: string
  score: number
  createdAt: string
}

const KEY = 'bt_sessions_v1'

function load(): Session[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function today(): string {
  // Use local date string to avoid UTC offset issues (China is UTC+8)
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addSession(
  gameType: string,
  gameName: string,
  score: number
): { gamesCompleted: number; goalReached: boolean } {
  const sessions = load()
  const date = today()
  sessions.push({ date, gameType, gameName, score, createdAt: new Date().toISOString() })
  localStorage.setItem(KEY, JSON.stringify(sessions))
  const todayCount = sessions.filter(s => s.date === date).length
  return { gamesCompleted: todayCount, goalReached: todayCount >= DAILY_GOAL }
}

export function getTodayData(): {
  sessions: Session[]
  gamesCompleted: number
  goalReached: boolean
} {
  const date = today()
  const sessions = load().filter(s => s.date === date)
  return { sessions, gamesCompleted: sessions.length, goalReached: sessions.length >= DAILY_GOAL }
}

export function getStats(): {
  sessions: Session[]
  dailyProgress: { date: string; gamesCompleted: number; goalReached: boolean }[]
  totalSessions: number
  streak: number
} {
  const all = load()
  const date = today()

  const byDate = all.reduce<Record<string, Session[]>>((acc, s) => {
    ;(acc[s.date] ??= []).push(s)
    return acc
  }, {})

  const dates = Object.keys(byDate).sort()
  const dailyProgress = dates.map(d => ({
    date: d,
    gamesCompleted: byDate[d].length,
    goalReached: byDate[d].length >= DAILY_GOAL,
  }))

  let streak = 0
  let cur = date
  const dateSet = new Set(dates)
  while (dateSet.has(cur)) {
    streak++
    const d = new Date(cur + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const dy = String(d.getDate()).padStart(2, '0')
    cur = `${y}-${mo}-${dy}`
  }

  return { sessions: all, dailyProgress, totalSessions: all.length, streak }
}
