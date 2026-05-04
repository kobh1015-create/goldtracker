import { useState, useRef } from 'react'
import { X, Camera, Loader } from 'lucide-react'

// 사진을 800px 이하로 압축해서 base64 반환 (localStorage 용량 절약)
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

const today = () => new Date().toISOString().slice(0, 10)

export default function RecordForm({ position, onSubmit, onClose }) {
  const [name, setName]       = useState('')
  const [date, setDate]       = useState(today)
  const [amount, setAmount]   = useState('')
  const [unit, setUnit]       = useState('mg')
  const [notes, setNotes]     = useState('')
  const [photo, setPhoto]     = useState(null)       // base64
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const compressed = await compressImage(file)
    setPhoto(compressed)
    setPreview(compressed)
    setLoading(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount || isNaN(Number(amount))) return
    onSubmit({
      name: name.trim() || `${position.lat.toFixed(3)}, ${position.lng.toFixed(3)}`,
      date,
      lat: position.lat,
      lng: position.lng,
      amount: Number(amount),
      unit,
      notes: notes.trim(),
      photo,
    })
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:w-96 bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 sticky top-0 bg-gray-800">
          <h2 className="font-bold text-yellow-400">사금 발견 기록</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 위치 */}
          <div className="bg-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400">
            <span className="text-gray-500">📍 위치</span>
            <span className="ml-2 font-mono text-gray-300">
              {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </span>
          </div>

          {/* 장소 이름 */}
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

          {/* 날짜 */}
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

          {/* 채취량 */}
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

          {/* 사진 */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">사진</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="미리보기" className="w-full h-40 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPreview(null) }}
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

          {/* 메모 */}
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
            기록 저장
          </button>
        </form>
      </div>
    </div>
  )
}
