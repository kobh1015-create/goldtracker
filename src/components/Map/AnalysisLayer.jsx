import { CircleMarker, Popup } from 'react-leaflet'
import { useMemo } from 'react'
import { CANDIDATES, MINES, POINT_BARS, CONFLUENCES } from '../../data/goldData'
import { scoreLocation, gradeColor } from '../../utils/goldAnalysis'

function ScoreBar({ score, max, color }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${(score / max) * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-6 text-right font-mono" style={{ color }}>{score}</span>
      <span className="text-gray-400">/{max}</span>
    </div>
  )
}

export default function AnalysisLayer() {
  const hotspots = useMemo(() =>
    CANDIDATES.map(c => ({
      ...c,
      analysis: scoreLocation(c.lat, c.lng, {
        mines: MINES,
        pointBars: POINT_BARS,
        confluences: CONFLUENCES,
        roadAccess: c.roadAccess,
      }),
    }))
  , [])

  return hotspots.map(({ id, name, lat, lng, analysis }) => {
    const color = gradeColor(analysis.total)
    const radius = 8 + (analysis.total / 100) * 12

    return (
      <CircleMarker
        key={id}
        center={[lat, lng]}
        radius={radius}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.35,
          weight: 2,
        }}
      >
        <Popup minWidth={220}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-sm">{name}</p>
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: color, color: 'white' }}
              >
                {analysis.grade}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500">종합 유망도</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${analysis.total}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-sm font-bold" style={{ color }}>{analysis.total}</span>
            </div>

            <div className="space-y-1.5 border-t pt-2">
              {analysis.breakdown.map((b) => (
                <div key={b.factor}>
                  <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                    <span>{b.factor}</span>
                    <span className="text-gray-400 truncate ml-2">{b.detail}</span>
                  </div>
                  <ScoreBar score={b.score} max={b.max} color={color} />
                </div>
              ))}
            </div>
          </div>
        </Popup>
      </CircleMarker>
    )
  })
}
