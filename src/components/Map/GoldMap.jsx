import { MapContainer, TileLayer, LayersControl, ZoomControl, CircleMarker, Popup } from 'react-leaflet'
import L from 'leaflet'
import MineMarker from './MineMarker'
import PointBarLayer from './PointBarLayer'
import LocationButton from './LocationButton'
import AnalysisLayer from './AnalysisLayer'
import MapClickHandler from './MapClickHandler'
import RecordMarker from './RecordMarker'
import { MINES, POINT_BARS, CONFLUENCES } from '../../data/goldData'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const { BaseLayer, Overlay } = LayersControl

export default function GoldMap({ records = [], onMapClick, onDeleteRecord, addMode, mapRef }) {
  return (
    <MapContainer
      center={[36.2, 127.8]}
      zoom={7}
      zoomControl={false}
      className="w-full h-full"
      style={{ cursor: addMode ? 'crosshair' : 'grab' }}
      ref={mapRef}
    >
      <ZoomControl position="bottomright" />
      <LocationButton />
      {addMode && <MapClickHandler onMapClick={onMapClick} />}

      <LayersControl position="topright">
        <BaseLayer checked name="일반 지도 (OSM)">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />
        </BaseLayer>
        <BaseLayer name="위성 지도 (Esri)">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri"
            maxZoom={19}
          />
        </BaseLayer>
        <BaseLayer name="지형 지도 (OpenTopoMap)">
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
            maxZoom={17}
          />
        </BaseLayer>

        <Overlay checked name="유망 스팟 분석">
          <AnalysisLayer />
        </Overlay>

        <Overlay checked name="폐광산 위치">
          <>
            {MINES.map((mine) => (
              <MineMarker key={mine.id} mine={mine} />
            ))}
          </>
        </Overlay>

        <Overlay checked name="Point Bar 구간">
          <>
            {POINT_BARS.map((pb) => (
              <PointBarLayer key={pb.id} pointBar={pb} />
            ))}
          </>
        </Overlay>

        <Overlay checked name="하천 합류부">
          <>
            {CONFLUENCES.map((c) => (
              <CircleMarker
                key={c.id}
                center={[c.lat, c.lng]}
                radius={7}
                pathOptions={{ color: '#60a5fa', fillColor: '#3b82f6', fillOpacity: 0.6, weight: 2 }}
              >
                <Popup>
                  <p className="font-bold text-sm text-blue-700">{c.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{c.rivers.join(' + ')}</p>
                  <p className="text-xs text-gray-400 mt-1">유속 감소 → 비중 퇴적 구간</p>
                </Popup>
              </CircleMarker>
            ))}
          </>
        </Overlay>

        <Overlay checked name="내 발견 기록">
          <>
            {records.map((r) => (
              <RecordMarker key={r.id} record={r} onDelete={onDeleteRecord} />
            ))}
          </>
        </Overlay>
      </LayersControl>
    </MapContainer>
  )
}
