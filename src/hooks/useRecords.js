import { useState, useEffect } from 'react'

const STORAGE_KEY = 'goldtracker_records'

export function useRecords() {
  const [records, setRecords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  }, [records])

  const addRecord = (data) => {
    const record = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    setRecords(prev => [record, ...prev])
    return record
  }

  const deleteRecord = (id) => {
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  return { records, addRecord, deleteRecord }
}
