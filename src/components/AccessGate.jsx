import { useState } from 'react'
import { Lock, Loader, KeyRound, AlertCircle, Smartphone } from 'lucide-react'

const ERRORS = {
  invalid:      '유효하지 않은 코드입니다. 다시 확인해주세요.',
  device_limit: '이 코드는 이미 다른 기기에서 사용 중입니다.\n관리자에게 문의하세요.',
}

export default function AccessGate({ onVerify }) {
  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')

    const result = await onVerify(code)

    if (!result.ok) {
      setError(ERRORS[result.reason] ?? ERRORS.invalid)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 border border-yellow-600/30 rounded-2xl mb-4">
            <Lock size={28} className="text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-yellow-400 tracking-wide">GoldTracker</h1>
          <p className="text-sm text-gray-500 mt-1">한국 사금 탐사 지도</p>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={16} className="text-yellow-500" />
            <p className="text-sm text-gray-300 font-medium">접근 코드를 입력하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value); setError('') }}
              placeholder="예) GT-A1B2-C3D4"
              autoFocus
              spellCheck={false}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white text-center text-lg font-mono tracking-widest placeholder-gray-600 focus:border-yellow-500 focus:outline-none transition-colors"
            />

            {error && (
              <div className="flex items-start gap-2 text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">
                {error.includes('기기') ? <Smartphone size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
                <span className="whitespace-pre-line">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader size={16} className="animate-spin" /> 확인 중...</>
                : '입장하기'
              }
            </button>
          </form>

          <p className="text-xs text-gray-600 text-center mt-4">
            코드가 없으신가요? 관리자에게 문의하세요.
          </p>
        </div>
      </div>
    </div>
  )
}
