// Required Supabase Storage:
// - Create a public bucket named "gold-photos" in the Supabase dashboard
// - Enable public access on the bucket

import { useState, useRef } from 'react'
import { X, Camera, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'

const SESSION_KEY = 'gt_access_code'

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 800
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

async function uploadPhoto(base64, recordId) {
  const code = localStorage.getItem(SESSION_KEY) ?? 'local'
  const path = `${code}/${recordId}.jpg`
  const res = await fetch(base64)
  const blob = await res.blob()
  const { error } = await supabase.storage
    .from('gold-photos')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
  if (error) {
    console.error('photo upload:', error)
    return base64 // fallback: store as base64
  }
  const { data: { publicUrl } } = supabase.storage.from('gold-photos').getPublicUrl(path)
  return publicUrl
}

const today = () => new Date().toISOString().slice(0, 10)

export default function RecordForm({ position, onSubmit, onClose, editRecord, onUpdate }) {
  const isEdit = !!editRecord
  const [name, setName]     = useState(editRecord?.name ?? '')
  const [date, setDate]     = useState(editRecord?.date ?? today)
  const [amount, setAmount] = useState(editRecord?.amount?.toString() ?? '')
  const [unit, setUnit]     = useState(editRecord?.unit ?? 'mg')
  const [notes, setNotes]   = useState(editRecord?.notes ?? '')
  const [photo, setPhoto]   = useState(editRecord?.photo ?? null)
  const [preview, setPreview] = useState(editRecord?.photo ?? null)
  const [newPhotoBase64, setNewPhotoBase64] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const compressed = await compressImage(file)
    setNewPhotoBase64(compressed)
    setPreview(compressed)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || isNaN(Number(amount))) return
    setLoading(true)

    const recordId = editRecord?.id ?? Date.now().toString()
    let finalPhoto = photo
    if (newPhotoBase64) {
      finalPhoto = await uploadPhoto(newPhotoBase64, recordId)
    }

    const lat = position?.lat ?? editRecord?.lat
    const lng = position?.lng ?? editRecord?.lng
    const data = {
      name: name.trim() || `${lat.toFixed(3)}, ${lng.toFixed(3)}`,
      date,
      lat,
      lng,
      amount: Number(amount),
      unit,
      notes: notes.trim(),
      photo: finalPhoto,
    }

    if (isEdit) {
      onUpdate(editRecord.id, data)
    } else {
      onSubmit(data)
    }
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:w-96 bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 sticky top-0 bg-gray-800">
          <h2 className="font-bold text-yellow-400">{isEdit ? '기록 수정' : '사금 발견 기록'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400">
            <span className="text-gray-500">📍 위치</span>
            <span className="ml-2 font-mono text-gray-300">
              {(position?.lat ?? editRecord?.lat).toFixed(5)}, {(position?.lng ?? editRecord?.lng).toFixed(5)}
            </span>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">장소 이름</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="예) 섬진강 ○○ 굽이"
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 border border-gray-600 focus:border-yellow-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">발견 날짜</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white border border-gray-600 focus:border-yellow-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">채취량 <span className="text-red-400">*</span></label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
                required
                className="flex-1 bg-gray-700 rounded-lg px-3 py-2 text-sm text-white border border-gray-600 focus:border-yellow-500 focus:outline-none"
              />
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="bg-gray-700 rounded-lg px-3 py-2 text-sm text-white border border-gray-600 focus:border-yellow-500 focus:outline-none"
              >
                <option value="mg">mg</option>
                <option value="g">g</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">사진</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="미리보기" className="w-full h-40 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPreview(null); setNewPhotoBase64(null) }}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black/80"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="w-full h-24 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-500 hover:border-yellow-600 hover:text-yellow-500 transition-colors"
              >
                {loading ? <Loader size={20} className="animate-spin" /> : <Camera size={20} />}
                <span className="text-xs">{loading ? '처리 중...' : '사진 선택'}</span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">메모</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="지형, 날씨, 채취 방법 등..."
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 border border-gray-600 focus:border-yellow-500 focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-gray-900 font-bold py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? '저장 중...' : isEdit ? '수정 완료' : '기록 저장'}
          </button>
        </form>
      </div>
    </div>
  )
}
