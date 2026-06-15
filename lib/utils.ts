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
  { type: 'memory',    name: '翻牌记忆', desc: '找出相同的牌',     bg: 'bg-blue-100',    fg: 'text-blue-600'    },
  { type: 'numbers',   name: '数字接龙', desc: '按顺序点击数字',   bg: 'bg-emerald-100', fg: 'text-emerald-600' },
  { type: 'clock',     name: '认识时钟', desc: '读出时钟时间',     bg: 'bg-amber-100',   fg: 'text-amber-700'   },
  { type: 'pattern',   name: '图案记忆', desc: '记住并复现图案',   bg: 'bg-violet-100',  fg: 'text-violet-600'  },
  { type: 'color',     name: '颜色记忆', desc: '找出相同的颜色',   bg: 'bg-rose-100',    fg: 'text-rose-600'    },
  { type: 'math',      name: '简单计算', desc: '口算加减法',       bg: 'bg-cyan-100',    fg: 'text-cyan-700'    },
  { type: 'drawclock', name: '画时钟',   desc: '在表盘上画出时间', bg: 'bg-orange-100',  fg: 'text-orange-600'  },
  { type: 'shopping',  name: '购物清单', desc: '记住清单上的物品', bg: 'bg-teal-100',    fg: 'text-teal-600'    },
  { type: 'reaction',  name: '反应训练', desc: '见绿点击，见红不动', bg: 'bg-lime-100',  fg: 'text-lime-600'    },
  { type: 'mapdir',    name: '地图方向', desc: '按方向找到终点',   bg: 'bg-sky-100',     fg: 'text-sky-600'     },
  { type: 'stock',     name: '炒股票',   desc: '低买高卖赚最多',   bg: 'bg-green-100',   fg: 'text-green-700'   },
  { type: 'dog',       name: '找白狗',   desc: '找出唯一的白狗',   bg: 'bg-yellow-100',  fg: 'text-yellow-700'  },
] as const

export type GameType = typeof GAME_LIST[number]['type']

export const DAILY_GOAL = 5
