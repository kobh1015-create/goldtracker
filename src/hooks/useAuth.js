import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const SESSION_KEY  = 'gt_access_code'
const DEVICE_KEY   = 'gt_device_id'

// 이 기기의 고유 ID — 최초 방문 시 생성, 이후 유지
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
    const stored   = localStorage.getItem(SESSION_KEY)
    const deviceId = getDeviceId()

    if (!stored) {
      setStatus('unauthorized')
      return
    }

    // 코드 활성 여부 + 이 기기가 여전히 등록되어 있는지 동시 확인
    const [codeRes, deviceRes] = await Promise.all([
      supabase.from('access_codes')
        .select('code')
        .eq('code', stored)
        .eq('active', true)
        .maybeSingle(),
      supabase.from('code_devices')
        .select('device_id')
        .eq('code', stored)
        .eq('device_id', deviceId)
        .maybeSingle(),
    ])

    if (codeRes.data && deviceRes.data) {
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

    // 1. 코드 유효성 확인
    const { data: codeData } = await supabase
      .from('access_codes')
      .select('code, max_devices')
      .eq('code', code)
      .eq('active', true)
      .maybeSingle()

    if (!codeData) return { ok: false, reason: 'invalid' }

    // 2. 이 기기가 이미 등록된 기기인지 확인 (재접속)
    const { data: existingDevice } = await supabase
      .from('code_devices')
      .select('device_id')
      .eq('code', code)
      .eq('device_id', deviceId)
      .maybeSingle()

    if (existingDevice) {
      localStorage.setItem(SESSION_KEY, code)
      setStatus('authorized')
      return { ok: true }
    }

    // 3. 신규 기기 — 등록된 기기 수 확인
    const { count } = await supabase
      .from('code_devices')
      .select('*', { count: 'exact', head: true })
      .eq('code', code)

    if (count >= codeData.max_devices) {
      return { ok: false, reason: 'device_limit' }
    }

    // 4. 기기 등록 후 입장
    await supabase.from('code_devices').insert({ code, device_id: deviceId })
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
