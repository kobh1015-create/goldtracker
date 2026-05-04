import { Polyline, Popup } from 'react-leaflet'

function scoreToColor(score) {
  if (score >= 80) return '#22c55e'  // green-500
  if (score >= 60) return '#eab308'  // yellow-500
  return '#f97316'                    // orange-500
}

export default function PointBarLayer({ pointBar }) {
  const color = scoreToColor(pointBar.score)

  return (
    <Polyline
      positions={pointBar.coords}
      pathOptions={{
        color,
        weight: 6,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    >
      <Popup>
        <div className="min-w-[160px]">
          <p className="font-bold text-sm" style={{ color }}>
            ◈ {pointBar.name}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">유망도</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{ width: `${pointBar.score}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-xs font-bold" style={{ color }}>
              {pointBar.score}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Point Bar — 비중 퇴적 구간</p>
        </div>
      </Popup>
    </Polyline>
  )
}
