import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

const mineIcon = L.divIcon({
  html: `<div style="
    width:28px; height:28px;
    background:#b45309;
    border:2px solid #fbbf24;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 2px 6px rgba(0,0,0,0.5);
  "></div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
})

export default function MineMarker({ mine }) {
  return (
    <Marker position={[mine.lat, mine.lng]} icon={mineIcon}>
      <Popup>
        <div className="min-w-[160px]">
          <p className="font-bold text-amber-800 text-sm">{mine.name}</p>
          <p className="text-xs text-gray-600 mt-1">📍 {mine.address}</p>
          <p className="text-xs text-gray-500 mt-0.5">🏞 {mine.river}</p>
          {mine.notes && (
            <p className="text-xs text-gray-500 mt-1 italic">{mine.notes}</p>
          )}
        </div>
      </Popup>
    </Marker>
  )
}
