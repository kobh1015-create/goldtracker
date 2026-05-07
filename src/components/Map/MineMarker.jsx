import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

function makeIcon(rank) {
  const bg     = rank === 1 ? '#b45309' : '#6b7280'
  const border = rank === 1 ? '#fbbf24' : '#d1d5db'
  return L.divIcon({
    html: `<div style="
      width:28px; height:28px;
      background:${bg};
      border:2px solid ${border};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 2px 6px rgba(0,0,0,0.5);
    "></div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  })
}

const RANK_LABEL = { 1: '금 주산물 ★', 2: '금 부산물' }
const RANK_COLOR = { 1: 'text-amber-700', 2: 'text-gray-500' }

export default function MineMarker({ mine }) {
  const icon = makeIcon(mine.goldRank)
  return (
    <Marker position={[mine.lat, mine.lng]} icon={icon}>
      <Popup>
        <div className="min-w-[170px]">
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-sm text-gray-800">{mine.name}</p>
            <span className={`text-xs font-semibold ${RANK_COLOR[mine.goldRank]}`}>
              {RANK_LABEL[mine.goldRank]}
            </span>
          </div>
          <p className="text-xs text-gray-600">📍 {mine.address}</p>
          <p className="text-xs text-gray-500 mt-0.5">🏞 {mine.river}</p>
          {mine.notes && (
            <p className="text-xs text-gray-400 mt-1 italic">{mine.notes}</p>
          )}
        </div>
      </Popup>
    </Marker>
  )
}
