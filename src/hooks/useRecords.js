// Required Supabase table (run in SQL editor):
// create table records (
//   id text primary key,
//   code text not null,
//   name text,
//   date text,
//   lat float8,
//   lng float8,
//   amount float8,
//   unit text default 'mg',
//   notes text,
//   photo text,
//   created_at timestamptz default now()
// );
// create index on records(code);

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SESSION_KEY = 'gt_access_code'
const LS_KEY = 'goldtracker_records'

function getCode() {
  return localStorage.getItem(SESSION_KEY)
}

export function useRecords() {
  const [records, setRecords] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) ?? [] } catch { return [] }
  })
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    const code = getCode()
    if (!code) { setSynced(true); return }
    supabase
      .from('records')
      .select('*')
      .eq('code', code)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setRecords(data)
        setSynced(true)
      })
  }, [])

  useEffect(() => {
    if (synced) localStorage.setItem(LS_KEY, JSON.stringify(records))
  }, [records, synced])

  const addRecord = async (data) => {
    const code = getCode()
    const record = {
      ...data,
      id: Date.now().toString(),
      code: code ?? 'local',
      created_at: new Date().toISOString(),
    }
    setRecords(prev => [record, ...prev])
    if (code) {
      const { error } = await supabase.from('records').insert(record)
      if (error) console.error('records insert:', error)
    }
    return record
  }

  const updateRecord = async (id, updates) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
    const code = getCode()
    if (code) {
      const { error } = await supabase.from('records').update(updates).eq('id', id).eq('code', code)
      if (error) console.error('records update:', error)
    }
  }

  const deleteRecord = async (id) => {
    setRecords(prev => prev.filter(r => r.id !== id))
    const code = getCode()
    if (code) {
      const { error } = await supabase.from('records').delete().eq('id', id).eq('code', code)
      if (error) console.error('records delete:', error)
    }
  }

  return { records, addRecord, updateRecord, deleteRecord }
}
