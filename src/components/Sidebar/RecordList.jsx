import { Trash2, MapPin } from 'lucide-react'

export default function RecordList({ records, onDelete }) {
  if (records.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-gray-500">
        <MapPin size={32} className="mb-2 opacity-40" />
        <p className="text-sm">아직 기록이 없습니다.</p>
        <p className="text-xs mt-1 text-gray-600">지도를 클릭하면 기록할 수 있어요</p>
      </div>
    )
  }

  const totalMg = records.reduce((sum, r) => {
    return sum + (r.unit === 'g' ? r.amount * 1000 : r.amount)
  }, 0)

  return (
    <>
      <div className="px-3 py-2 bg-gray-700/50 border-b border-gray-700 flex items-center justify-between text-xs">
        <span className="text-gray-400">총 {records.length}건</span>
        <span className="text-yellow-400 font-semibold">
          누적 {totalMg >= 1000 ? `${(totalMg / 1000).toFixed(2)}g` : `${totalMg.toFixed(1)}mg`}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-700/50">
        {records.map((r) => {
          const dateStr = new Date(r.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
          return (
            <div key={r.id} className="flex gap-2 p-3 hover:bg-gray-700/30 transition-colors">
              {r.photo ? (
                <img src={r.photo} alt="" className="w-12 h-12 object-cover rounded-lg shrink-0" />
              ) : (
                <div className="w-12 h-12 bg-gray-700 rounded-lg shrink-0 flex items-center justify-center text-xl">
                  ✨
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{r.name || '무제 기록'}</p>
                <p className="text-xs text-gray-400">{dateStr}</p>
                <p className="text-xs text-yellow-400 font-semibold">
                  {r.amount}{r.unit}
                </p>
                {r.notes && (
                  <p className="text-xs text-gray-500 truncate italic mt-0.5">"{r.notes}"</p>
                )}
              </div>
              <button
                onClick={() => onDelete(r.id)}
                className="text-gray-600 hover:text-red-400 transition-colors shrink-0 self-start mt-0.5"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}
