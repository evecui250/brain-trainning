import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '脑力训练 — 认知健康',
  description: '每日认知训练，守护大脑健康',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="min-h-screen flex flex-col">
        <main className="flex-1 pb-24">
          {children}
        </main>
      </body>
    </html>
  )
}
