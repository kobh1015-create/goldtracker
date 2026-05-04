import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const SESSION_KEY = 'gt_access_code'
const DEVICE_KEY  = 'gt_device_id'

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

export function useAuth() {
  const [status, setStatus] = useState('checking')

  const checkSession = useCallback(async () => {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) { setStatus('unauthorized'); return }

    // 코드가 여전히 활성화 상태인지만 확인 (기기 등록 여부는 무관)
    const { data } = await supabase
      .from('access_codes')
      .select('code')
      .eq('code', stored)
      .eq('active', true)
      .maybeSingle()

    if (data) {
      setStatus('authorized')
    } else {
      localStorage.removeItem(SESSION_KEY)
      setStatus('unauthorized')
    }
  }, [])

  useEffect(() => {
    checkSession()
    window.addEventListener('focus', checkSession)
    return () => window.removeEventListener('focus', checkSession)
  }, [checkSession])

  const verify = async (inputCode) => {
    const code     = inputCode.trim().toUpperCase()
    const deviceId = getDeviceId()

    // 코드 유효성 확인
    const { data: codeData } = await supabase
      .from('access_codes')
      .select('code, max_devices')
      .eq('code', code)
      .eq('active', true)
      .maybeSingle()

    if (!codeData) return { ok: false, reason: 'invalid' }

    // 슬롯 여유 있으면 기기 등록 (자동로그인용) — 꽉 차도 입장은 허용
    const { count } = await supabase
      .from('code_devices')
      .select('*', { count: 'exact', head: true })
      .eq('code', code)

    if ((count ?? 0) < codeData.max_devices) {
      await supabase
        .from('code_devices')
        .upsert({ code, device_id: deviceId }, { onConflict: 'code,device_id' })
    }

    localStorage.setItem(SESSION_KEY, code)
    setStatus('authorized')
    return { ok: true }
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setStatus('unauthorized')
  }

  return { status, verify, logout }
}
