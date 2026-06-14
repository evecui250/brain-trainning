'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { addSession } from '@/lib/storage'

type Q = { question: string; options: string[]; answer: number }

const QUESTIONS: Q[] = [
  { question: '苹果属于哪一类？', options: ['动物', '水果', '交通', '蔬菜'], answer: 1 },
  { question: '"高兴"的反义词是？', options: ['快乐', '幸福', '难过', '开心'], answer: 2 },
  { question: '医生在哪里工作？', options: ['学校', '餐厅', '医院', '商场'], answer: 2 },
  { question: '下面哪个是交通工具？', options: ['椅子', '火车', '书桌', '电视'], answer: 1 },
  { question: '"春天"之后是什么季节？', options: ['冬天', '秋天', '夏天', '雨季'], answer: 2 },
  { question: '哪个动物会游泳？', options: ['猫', '狗', '金鱼', '小鸡'], answer: 2 },
  { question: '"书"是用来做什么的？', options: ['吃饭', '阅读', '睡觉', '运动'], answer: 1 },
  { question: '星期三的前一天是？', options: ['星期四', '星期五', '星期二', '星期一'], answer: 2 },
  { question: '下面哪个是蔬菜？', options: ['香蕉', '西瓜', '胡萝卜', '草莓'], answer: 2 },
  { question: '太阳从哪个方向升起？', options: ['西方', '南方', '东方', '北方'], answer: 2 },
]

function shuffle<T>(a: T[]): T[] {
  const arr = [...a]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function WordGame() {
  const router = useRouter()
  const questions = useMemo(() => shuffle(QUESTIONS).slice(0, 8), [])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [done, setDone] = useState(false)

  const q = questions[idx]

  function handleSelect(i: number) {
    if (selected !== null) return
    setSelected(i)
    if (i === q.answer) setScore(s => s + 1)
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        setDone(true)
      } else {
        setIdx(n => n + 1)
        setSelected(null)
      }
    }, 1200)
  }

  function handleComplete() {
    addSession('word', '词语联想', Math.round((score / questions.length) * 100))
    router.push('/games')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <NavBar />
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push('/games')} className="text-3xl">←</button>
        <h1 className="text-2xl font-bold">💬 词语联想</h1>
      </div>
      <p className="text-gray-500 text-lg mb-4">选择最合适的答案</p>

      {!done ? (
        <div>
          <div className="text-center text-gray-500 text-lg mb-4">
            第 {idx + 1} / {questions.length} 题 · 得分：{score}
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-5">
            <p className="text-2xl font-bold text-gray-800 text-center">{q.question}</p>
          </div>
          <div className="flex flex-col gap-3">
            {q.options.map((opt, i) => {
              let cls = 'bg-white border-2 border-gray-200 text-gray-800'
              if (selected !== null) {
                if (i === q.answer) cls = 'bg-green-100 border-2 border-green-500 text-green-700'
                else if (i === selected) cls = 'bg-red-100 border-2 border-red-400 text-red-700'
              }
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`py-4 px-5 rounded-xl text-xl font-medium text-left transition-all ${cls}`}
                >
                  {['A', 'B', 'C', 'D'][i]}. {opt}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-5 text-center">
          <p className="text-4xl mb-2">🎉</p>
          <p className="text-2xl font-bold text-green-700 mb-1">完成！</p>
          <p className="text-xl text-gray-600 mb-4">答对 {score} / {questions.length} 题</p>
          <button onClick={handleComplete}
            className="w-full bg-green-500 text-white text-xl font-bold py-4 rounded-xl">
            记录并继续 →
          </button>
        </div>
      )}
    </div>
  )
}
