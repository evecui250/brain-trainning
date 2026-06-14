'use client'

type P = { className?: string }

export function MemoryIcon({ className }: P) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      {/* back card */}
      <rect x="2" y="8" width="17" height="21" rx="3" fill="#93c5fd"/>
      {/* front card */}
      <rect x="13" y="3" width="17" height="21" rx="3" fill="#2563eb"/>
      {/* lines on front */}
      <rect x="16.5" y="9" width="9" height="2.5" rx="1.2" fill="white" opacity="0.9"/>
      <rect x="16.5" y="14" width="9" height="2.5" rx="1.2" fill="white" opacity="0.9"/>
      <rect x="16.5" y="19" width="5.5" height="2.5" rx="1.2" fill="white" opacity="0.6"/>
    </svg>
  )
}

export function NumbersIcon({ className }: P) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <circle cx="6"  cy="26" r="5.5" fill="#a7f3d0"/>
      <circle cx="16" cy="16" r="5.5" fill="#34d399"/>
      <circle cx="26" cy="6"  r="5.5" fill="#10b981"/>
      <circle cx="6"  cy="26" r="2"   fill="#047857"/>
      <circle cx="16" cy="16" r="2"   fill="#047857"/>
      <circle cx="26" cy="6"  r="2"   fill="#047857"/>
    </svg>
  )
}

export function ClockReadIcon({ className }: P) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <circle cx="16" cy="16" r="13.5" stroke="#f59e0b" strokeWidth="2.5" fill="#fff"/>
      <line x1="16" y1="3.5"  x2="16" y2="6.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="28.5" y1="16" x2="25.5" y2="16" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="28.5" x2="16" y2="25.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="3.5"  y1="16" x2="6.5" y2="16" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
      {/* hour hand */}
      <line x1="16" y1="16" x2="11" y2="9" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round"/>
      {/* minute hand */}
      <line x1="16" y1="16" x2="23" y2="14" stroke="#b45309" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="16" cy="16" r="2" fill="#334155"/>
    </svg>
  )
}

export function PatternIcon({ className }: P) {
  const cells: [number, number, string][] = [
    [2,  2,  '#7c3aed'], [12, 2,  '#ddd6fe'], [22, 2,  '#7c3aed'],
    [2,  12, '#ddd6fe'], [12, 12, '#a78bfa'], [22, 12, '#ddd6fe'],
    [2,  22, '#7c3aed'], [22, 22, '#ddd6fe'], [12, 22, '#8b5cf6'],
  ]
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      {cells.map(([x, y, fill]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="8.5" height="8.5" rx="1.5" fill={fill}/>
      ))}
    </svg>
  )
}

export function ColorMemIcon({ className }: P) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="12"   cy="13"  r="9.5" fill="#f87171" opacity="0.88"/>
      <circle cx="21"   cy="13"  r="9.5" fill="#60a5fa" opacity="0.88"/>
      <circle cx="16.5" cy="22"  r="9.5" fill="#4ade80" opacity="0.88"/>
    </svg>
  )
}

export function MathIcon({ className }: P) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      {/* Plus */}
      <rect x="3"   y="11"  width="12" height="3.5" rx="1.75" fill="#0891b2"/>
      <rect x="7.3" y="6.8" width="3.5" height="12" rx="1.75" fill="#0891b2"/>
      {/* Minus */}
      <rect x="18" y="19" width="11" height="3.5" rx="1.75" fill="#06b6d4"/>
    </svg>
  )
}

export function DrawClockIcon({ className }: P) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <circle cx="13" cy="13" r="11" stroke="#fb923c" strokeWidth="2" fill="white"/>
      <line x1="13" y1="13" x2="13" y2="6.5" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="13" y1="13" x2="19" y2="13" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="13" cy="13" r="1.5" fill="#475569"/>
      {/* Pencil body */}
      <path d="M22 21 L27 16 L29.5 18.5 L24.5 23.5 Z" fill="#fb923c"/>
      {/* Pencil tip */}
      <path d="M22 21 L24.5 23.5 L22 26 Z" fill="#fde68a"/>
      {/* Pencil highlight */}
      <line x1="24.5" y1="17" x2="27.5" y2="20" stroke="#ea580c" strokeWidth="1" opacity="0.5"/>
    </svg>
  )
}

export function GameIcon({ type, className = 'w-6 h-6' }: { type: string; className?: string }) {
  const p = { className }
  switch (type) {
    case 'memory':    return <MemoryIcon {...p} />
    case 'numbers':   return <NumbersIcon {...p} />
    case 'clock':     return <ClockReadIcon {...p} />
    case 'pattern':   return <PatternIcon {...p} />
    case 'color':     return <ColorMemIcon {...p} />
    case 'math':      return <MathIcon {...p} />
    case 'drawclock': return <DrawClockIcon {...p} />
    default:          return null
  }
}
