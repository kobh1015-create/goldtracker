import { useMap } from 'react-leaflet'
import { useCallback, useState } from 'react'
import L from 'leaflet'
import { LocateFixed, Loader } from 'lucide-react'

const myLocationIcon = L.divIcon({
  html: `<div style="
    width:16px; height:16px;
    background:#3b82f6;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 0 0 3px rgba(59,130,246,0.4);
  "></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

export default function LocationButton() {
  const map = useMap()
  const [loading, setLoading] = useState(false)

  const handleLocate = useCallback(() => {
    setLoading(true)
    map.locate({ setView: true, maxZoom: 14 })

    map.once('locationfound', (e) => {
      setLoading(false)
      L.marker(e.latlng, { icon: myLocationIcon })
        .addTo(map)
        .bindPopup('현재 위치')
        .openPopup()
    })

    map.once('locationerror', () => {
      setLoading(false)
      alert('위치 정보를 가져올 수 없습니다.')
    })
  }, [map])

  return (
    <div className="leaflet-bottom leaflet-left" style={{ marginBottom: '80px' }}>
      <div className="leaflet-control">
        <button
          onClick={handleLocate}
          title="현재 위치로 이동"
          style={{
            width: '34px', height: '34px',
            background: 'white',
            border: '2px solid rgba(0,0,0,0.3)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
          }}
        >
          {loading
            ? <Loader size={16} color="#374151" className="animate-spin" />
            : <LocateFixed size={16} color="#374151" />
          }
        </button>
      </div>
    </div>
  )
}
