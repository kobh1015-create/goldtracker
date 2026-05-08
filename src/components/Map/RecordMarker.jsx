import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Trash2, Pencil } from 'lucide-react'

const recordIcon = L.divIcon({
  html: `<div style="
    width:24px; height:24px;
    background:#fbbf24;
    border:2px solid #92400e;
    border-radius:3px;
    transform:rotate(45deg);
    box-shadow:0 2px 6px rgba(0,0,0,0.5);
  "></div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
})

export default function RecordMarker({ record, onDelete, onEdit }) {
  const dateStr = new Date(record.date).toLocaleDateString('ko-KR')

  return (
    <Marker position={[record.lat, record.lng]} icon={recordIcon}>
      <Popup minWidth={200}>
        <div>
          {record.photo && (
            <img src={record.photo} alt="사금 사진" className="w-full h-28 object-cover rounded mb-2" />
          )}
          <p className="font-bold text-amber-700 text-sm">{record.name || '무제 기록'}</p>
          <div className="mt-1 space-y-0.5 text-xs text-gray-600">
            <p>📅 {dateStr}</p>
            <p>⚖️ 채취량: <span className="font-semibold text-amber-600">{record.amount}{record.unit}</span></p>
            <p>📍 {record.lat.toFixed(5)}, {record.lng.toFixed(5)}</p>
            {record.notes && <p className="text-gray-500 mt-1 italic">"{record.notes}"</p>}
          </div>
          <div className="mt-2 flex gap-3">
            <button
              onClick={() => onEdit(record)}
              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800"
            >
              <Pencil size={12} /> 수정
            </button>
            <button
              onClick={() => onDelete(record.id)}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
            >
              <Trash2 size={12} /> 삭제
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
