import { Trash2, MapPin, Pencil, Download } from 'lucide-react'

function toMg(r) {
  return r.unit === 'g' ? r.amount * 1000 : r.amount
}

function fmtMg(mg) {
  return mg >= 1000 ? `${(mg / 1000).toFixed(2)}g` : `${mg.toFixed(1)}mg`
}

function exportCSV(records) {
  const headers = ['이름', '날짜', '채취량', '단위', '위도', '경도', '메모']
  const rows = records.map(r => [
    r.name ?? '',
    r.date ?? '',
    r.amount ?? '',
    r.unit ?? '',
    r.lat?.toFixed(5) ?? '',
    r.lng?.toFixed(5) ?? '',
    (r.notes ?? '').replace(/,/g, '；'),
  ])
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `사금기록_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function getMonthlyStats(records) {
  const map = {}
  for (const r of records) {
    if (!r.date) continue
    const month = r.date.slice(0, 7)
    map[month] = (map[month] ?? 0) + toMg(r)
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 4)
}

export default function RecordList({ records, onDelete, onEdit }) {
  if (records.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-gray-500">
        <MapPin size={32} className="mb-2 opacity-40" />
        <p className="text-sm">아직 기록이 없습니다.</p>
        <p className="text-xs mt-1 text-gray-600">지도를 클릭하면 기록할 수 있어요</p>
      </div>
    )
  }

  const totalMg = records.reduce((sum, r) => sum + toMg(r), 0)
  const best = records.reduce((a, b) => toMg(a) >= toMg(b) ? a : b)
  const monthly = getMonthlyStats(records)
  const maxMonthMg = monthly.length ? Math.max(...monthly.map(([, v]) => v)) : 1

  return (
    <>
      {/* 통계 패널 */}
      <div className="px-3 py-2.5 bg-gray-700/50 border-b border-gray-700 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">총 {records.length}회 탐사</span>
          <button
            onClick={() => exportCSV(records)}
            className="flex items-center gap-1 text-gray-500 hover:text-yellow-400 transition-colors"
          >
            <Download size={11} />
            <span>CSV 내보내기</span>
          </button>
        </div>

        <div className="text-center">
          <span className="text-yellow-400 font-bold text-xl">{fmtMg(totalMg)}</span>
          <span className="text-xs text-gray-500 ml-1">누적</span>
        </div>

        <div className="text-xs text-gray-500 text-center truncate">
          최고 기록: <span className="text-yellow-500">{best.name || '무제'}</span>
          {' '}({fmtMg(toMg(best))})
        </div>

        {monthly.length > 1 && (
          <div className="space-y-1.5 pt-1">
            {monthly.map(([month, mg]) => (
              <div key={month} className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 w-14 shrink-0">{month}</span>
                <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-yellow-500 transition-all"
                    style={{ width: `${Math.round((mg / maxMonthMg) * 100)}%` }}
                  />
                </div>
                <span className="text-yellow-400 w-12 text-right shrink-0">{fmtMg(mg)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 기록 목록 */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-700/50">
        {records.map((r) => {
          const dateStr = new Date(r.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
          return (
            <div key={r.id} className="flex gap-2 p-3 hover:bg-gray-700/30 transition-colors">
              {r.photo ? (
                <img src={r.photo} alt="" className="w-12 h-12 object-cover rounded-lg shrink-0" />
              ) : (
                <div className="w-12 h-12 bg-gray-700 rounded-lg shrink-0 flex items-center justify-center text-xl">✨</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{r.name || '무제 기록'}</p>
                <p className="text-xs text-gray-400">{dateStr}</p>
                <p className="text-xs text-yellow-400 font-semibold">{r.amount}{r.unit}</p>
                {r.notes && <p className="text-xs text-gray-500 truncate italic mt-0.5">"{r.notes}"</p>}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0 self-start mt-0.5">
                <button onClick={() => onEdit(r)} className="text-gray-600 hover:text-yellow-400 transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => onDelete(r.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
