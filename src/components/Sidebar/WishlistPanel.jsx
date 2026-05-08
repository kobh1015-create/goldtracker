import { Star, ChevronRight, Bookmark } from 'lucide-react'
import { gradeColor } from '../../utils/goldAnalysis'

export default function WishlistPanel({ hotspots, wishlist, flyToSpot, closePanel }) {
  const wishlisted = hotspots.filter(h => wishlist.has(h.id))

  if (wishlisted.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500">
        <Bookmark size={32} className="mb-2 opacity-30" />
        <p className="text-sm">탐사 예정 스팟이 없습니다.</p>
        <p className="text-xs mt-1 text-gray-600">
          분석 탭에서 ☆ 버튼으로 추가하세요
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="px-3 py-2 border-b border-gray-700 shrink-0">
        <p className="text-xs font-semibold text-gray-300">탐사 예정 스팟 ({wishlisted.length})</p>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-gray-700/50">
        {wishlisted.map((h) => {
          const color = gradeColor(h.analysis.total)
          return (
            <div
              key={h.id}
              className="flex items-center px-3 py-2.5 hover:bg-gray-700/40 cursor-pointer active:bg-gray-600/50 transition-colors"
              onClick={() => { flyToSpot(h.lat, h.lng, 13); closePanel?.() }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{h.name}</p>
                <p className="text-xs text-gray-400 truncate">📍 {h.address}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-1">
                    <div
                      className="h-1 rounded-full"
                      style={{ width: `${h.analysis.total}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color }}>
                    {h.analysis.total}점
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); wishlist.toggle(h.id) }}
                className="ml-2 shrink-0 text-yellow-400"
              >
                <Star size={14} fill="currentColor" />
              </button>
              <ChevronRight size={12} className="text-gray-600 ml-1 shrink-0" />
            </div>
          )
        })}
      </div>
    </>
  )
}
