import { useEffect } from 'react'

// 특정 조건이 true일 때 뒤로가기를 가로채서 onBack 실행
export function useBackButton(active, onBack) {
  useEffect(() => {
    if (active) {
      window.history.pushState({ intercepted: true }, '')
    }
  }, [active])

  useEffect(() => {
    if (!active) return
    const handler = () => onBack()
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [active, onBack])
}
