export function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export function getWeekday(): string {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[new Date().getDay()]
}

export const GAME_LIST = [
  { type: 'memory', name: '翻牌记忆', icon: '🃏', desc: '找出相同的牌' },
  { type: 'numbers', name: '数字接龙', icon: '🔢', desc: '按顺序点击数字' },
  { type: 'clock', name: '认识时钟', icon: '🕐', desc: '读出时钟时间' },
  { type: 'pattern', name: '图案记忆', icon: '🎨', desc: '记住并复现图案' },
  { type: 'word', name: '词语联想', icon: '💬', desc: '选出相关词语' },
  { type: 'math', name: '简单计算', icon: '➕', desc: '口算加减法' },
] as const

export type GameType = typeof GAME_LIST[number]['type']

export const DAILY_GOAL = 5
