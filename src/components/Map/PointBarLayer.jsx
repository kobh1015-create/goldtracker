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
          <p className="font-bold text-sm" style={{ color }}>◈ {pointBar.name}</p>
          <p className="text-xs text-gray-500 mt-1">📍 {pointBar.address}</p>
          <p className="text-xs text-gray-400 mt-0.5">🏞 {pointBar.river}</p>
          <p className="text-xs text-gray-400 mt-2">Point Bar — 비중 퇴적 구간</p>
        </div>
      </Popup>
    </Polyline>
  )
}
