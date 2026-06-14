'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-6xl mb-4">😔</p>
      <h2 className="text-2xl font-bold text-gray-700 mb-2">出现了一个错误</h2>
      <p className="text-gray-500 text-lg mb-6">请点击下方按钮重新尝试</p>
      <button
        onClick={reset}
        className="bg-blue-600 text-white text-xl font-bold py-4 px-8 rounded-2xl"
      >
        重新加载
      </button>
    </div>
  )
}
