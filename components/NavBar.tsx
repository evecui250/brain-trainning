'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: '首页' },
  { href: '/games', label: '训练' },
  { href: '/stats', label: '记录' },
]

export default function NavBar() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(({ href, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 py-4 text-center text-lg font-semibold tracking-wide transition-colors ${
                active ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              {active && (
                <span className="block w-6 h-0.5 bg-indigo-600 rounded-full mx-auto mb-1" />
              )}
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
