import { useMemo, useState, useRef, useCallback } from 'react'
import { Map, Pickaxe, Waves, GitMerge, Star, PlusCircle, BookOpen,
         BarChart2, X, LogOut, ChevronRight, ChevronDown, ArrowLeft, Bookmark } from 'lucide-react'
import GoldMap from './components/Map/GoldMap'
import RecordForm from './components/RecordForm'
import RecordList from './components/Sidebar/RecordList'
import WishlistPanel from './components/Sidebar/WishlistPanel'
import AccessGate from './components/AccessGate'
import { useAuth } from './hooks/useAuth'
import { MINES, POINT_BARS, CONFLUENCES, CANDIDATES } from './data/goldData'
import { scoreLocation, gradeColor } from './utils/goldAnalysis'
import { useRecords } from './hooks/useRecords'
import { useWishlist } from './hooks/useWishlist'
import { useBackButton } from './hooks/useBackButton'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-yellow-400 text-sm animate-pulse">확인 중...</div>
    </div>
  )
}

function centroid(coords) {
  const lat = coords.reduce((s, c) => s + c[0], 0) / coords.length
  const lng = coords.reduce((s, c) => s + c[1], 0) / coords.length
  return [lat, lng]
}

function StatCard({ icon: Icon, label, value, color, onClick, isActive }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg p-3 flex items-center gap-3 w-full transition-all text-left border ${
        isActive
          ? 'border-yellow-500 bg-gray-600'
          : 'border-transparent bg-gray-700 hover:bg-gray-600'
      }`}
    >
      <Icon size={18} color={color} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-lg font-bold" style={{ color }}>{value}</p>
      </div>
      {isActive
        ? <ChevronDown size={14} className="text-yellow-400 shrink-0" />
        : <ChevronRight size={14} className="text-gray-500 shrink-0" />
      }
    </button>
  )
}

function CategoryList({ category, hotspots, flyToSpot, closePanel, wishlist }) {
  const items = useMemo(() => {
    if (category === 'mines')       return MINES.map(m => ({ key: m.id, name: m.name, sub: m.address, detail: m.river, lat: m.lat, lng: m.lng, zoom: 12 }))
    if (category === 'pointBars')   return POINT_BARS.map(p => { const [lat, lng] = centroid(p.coords); return { key: p.id, name: p.name, sub: p.address, detail: p.river, lat, lng, zoom: 13 } })
    if (category === 'confluences') return CONFLUENCES.map(c => ({ key: c.id, name: c.name, sub: c.address, detail: c.rivers.join(' + '), lat: c.lat, lng: c.lng, zoom: 13 }))
    if (category === 'candidates')  return hotspots.map((h, i) => ({ key: h.id, name: h.name, sub: h.address, detail: `유망도 ${h.analysis.total}점`, lat: h.lat, lng: h.lng, zoom: 13, score: h.analysis.total, rank: i + 1 }))
    return []
  }, [category, hotspots])

  return (
    <div className="flex-1 overflow-y-auto">
      {items.map((item) => {
        const color = item.score != null ? gradeColor(item.score) : null
        const isWishlisted = category === 'candidates' && wishlist?.has(item.key)
        return (
          <div key={item.key} className="flex items-stretch border-b border-gray-700/40">
            <button
              onClick={() => { flyToSpot(item.lat, item.lng, item.zoom); closePanel?.() }}
              className="flex-1 text-left px-3 py-2.5 hover:bg-gray-700/50 active:bg-gray-600/50 flex items-center gap-2 transition-colors"
            >
              {item.rank && (
                <span className="text-xs text-gray-500 w-4 shrink-0">{item.rank}</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{item.name}</p>
                <p className="text-xs text-gray-400 truncate">📍 {item.sub}</p>
                {item.detail && <p className="text-xs truncate" style={{ color: color ?? '#6b7280' }}>{item.detail}</p>}
              </div>
              {item.score != null && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                  style={{ backgroundColor: color + '33', color }}>
                  {item.score}
                </span>
              )}
              <ChevronRight size={12} className="text-gray-600 shrink-0" />
            </button>
            {category === 'candidates' && (
              <button
                onClick={() => wishlist?.toggle(item.key)}
                className="px-2.5 flex items-center hover:bg-gray-700/50 transition-colors"
              >
                <Star
                  size={14}
                  className={isWishlisted ? 'text-yellow-400' : 'text-gray-400'}
                  fill={isWishlisted ? 'currentColor' : 'none'}
                />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

const CATEGORY_LABELS = {
  mines:       { label: '폐광산',    icon: Pickaxe,  color: '#fbbf24', count: MINES.length },
  pointBars:   { label: 'Point Bar', icon: Waves,    color: '#22c55e', count: POINT_BARS.length },
  confluences: { label: '합류부',    icon: GitMerge, color: '#60a5fa', count: CONFLUENCES.length },
  candidates:  { label: '분석 스팟', icon: Star,     color: '#f97316', count: CANDIDATES.length },
}

function SidebarContent({ tab, hotspots, records, deleteRecord, editRecord, flyToSpot, closePanel, wishlist }) {
  const [expandedCategory, setExpandedCategory] = useState(null)

  const toggle = (cat) => setExpandedCategory(prev => prev === cat ? null : cat)

  useBackButton(!!expandedCategory, useCallback(() => setExpandedCategory(null), []))

  if (tab === 'records') return <RecordList records={records} onDelete={deleteRecord} onEdit={editRecord} />
  if (tab === 'wishlist') return <WishlistPanel hotspots={hotspots} wishlist={wishlist} flyToSpot={flyToSpot} closePanel={closePanel} />

  return (
    <>
      <div className="p-3 grid grid-cols-2 gap-2 border-b border-gray-700 shrink-0">
        {Object.entries(CATEGORY_LABELS).map(([key, { label, icon, color, count }]) => (
          <StatCard key={key} icon={icon} label={label} value={count} color={color}
            onClick={() => toggle(key)} isActive={expandedCategory === key} />
        ))}
      </div>

      {expandedCategory ? (
        <>
          <div className="px-3 py-2 border-b border-gray-700 flex items-center gap-2 shrink-0">
            <button onClick={() => setExpandedCategory(null)} className="text-gray-400 hover:text-white">
              <ArrowLeft size={14} />
            </button>
            <p className="text-xs font-semibold text-gray-300">
              {CATEGORY_LABELS[expandedCategory].label} 목록
            </p>
          </div>
          <CategoryList
            category={expandedCategory}
            hotspots={hotspots}
            flyToSpot={flyToSpot}
            closePanel={closePanel}
            wishlist={wishlist}
          />
        </>
      ) : (
        <>
          <div className="px-3 py-2 border-b border-gray-700 shrink-0">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">유망도 순위</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {hotspots.map((h, i) => {
              const color = gradeColor(h.analysis.total)
              const isWishlisted = wishlist.has(h.id)
              return (
                <div key={h.id} className="flex items-stretch border-b border-gray-700/50">
                  <div
                    onClick={() => { flyToSpot(h.lat, h.lng, 13); closePanel?.() }}
                    className="flex-1 px-3 py-2.5 hover:bg-gray-700/40 cursor-pointer active:bg-gray-600/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-4 shrink-0">{i + 1}</span>
                      <span className="flex-1 text-xs truncate">{h.name}</span>
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                        style={{ backgroundColor: color + '33', color }}>
                        {h.analysis.total}
                      </span>
                    </div>
                    <div className="ml-6 mt-1 bg-gray-700 rounded-full h-1">
                      <div className="h-1 rounded-full" style={{ width: `${h.analysis.total}%`, backgroundColor: color }} />
                    </div>
                  </div>
                  <button
                    onClick={() => wishlist.toggle(h.id)}
                    className="px-2.5 flex items-center hover:bg-gray-700/40 transition-colors"
                  >
                    <Star
                      size={14}
                      className={isWishlisted ? 'text-yellow-400' : 'text-gray-400'}
                      fill={isWishlisted ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>
              )
            })}
          </div>
          <div className="p-3 border-t border-gray-700 text-xs text-gray-500 leading-relaxed shrink-0">
            <p className="font-semibold text-gray-400 mb-1">점수 산정 기준</p>
            <p>폐광산(40) + Point Bar(35) + 합류부(15) + 복합보너스(10)</p>
          </div>
        </>
      )}
    </>
  )
}

const TABS = [
  { key: 'analysis', icon: BarChart2 },
  { key: 'records',  icon: BookOpen  },
  { key: 'wishlist', icon: Bookmark  },
]

function tabLabel(key, records, wishlist) {
  if (key === 'records')  return `기록 (${records.length})`
  if (key === 'wishlist') return `즐겨찾기 (${wishlist.length})`
  return '분석'
}

export default function App() {
  const { status, verify, logout } = useAuth()
  const { records, addRecord, updateRecord, deleteRecord } = useRecords()
  const wishlist = useWishlist()
  const [pendingPos, setPendingPos]       = useState(null)
  const [editingRecord, setEditingRecord] = useState(null)
  const [addMode, setAddMode]             = useState(false)
  const [sidebarTab, setSidebarTab]       = useState('analysis')
  const [mobilePanel, setMobilePanel]     = useState(null)
  const mapRef = useRef(null)

  const hotspots = useMemo(() =>
    CANDIDATES
      .map(c => ({ ...c, analysis: scoreLocation(c.lat, c.lng, { mines: MINES, pointBars: POINT_BARS, confluences: CONFLUENCES }) }))
      .sort((a, b) => b.analysis.total - a.analysis.total)
  , [])

  useBackButton(!!mobilePanel, useCallback(() => setMobilePanel(null), []))

  if (status === 'checking')     return <LoadingScreen />
  if (status === 'unauthorized') return <AccessGate onVerify={verify} />

  const flyToSpot = (lat, lng, zoom = 13) => mapRef.current?.flyTo([lat, lng], zoom, { duration: 1 })

  const handleMapClick    = (pos) => { if (!addMode) return; setPendingPos(pos); setAddMode(false) }
  const handleFormSubmit  = (data) => { addRecord(data); setPendingPos(null) }
  const handleEditRecord  = (record) => { setEditingRecord(record); setMobilePanel(null) }
  const handleUpdateRecord = (id, data) => { updateRecord(id, data); setEditingRecord(null) }
  const openMobilePanel   = (tab) => setMobilePanel(prev => prev === tab ? null : tab)

  const sharedProps = {
    tab: sidebarTab,
    hotspots,
    records,
    deleteRecord,
    editRecord: handleEditRecord,
    flyToSpot,
    wishlist,
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="flex items-center gap-3 px-4 py-2.5 bg-gray-800 border-b border-yellow-700 shadow-md shrink-0">
        <Map className="text-yellow-400" size={22} />
        <h1 className="text-lg font-bold text-yellow-400 tracking-wide">GoldTracker</h1>

        <button onClick={logout} className="ml-auto text-gray-500 hover:text-gray-300 transition-colors" title="로그아웃">
          <LogOut size={16} />
        </button>
        <button
          onClick={() => setAddMode(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            addMode ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {addMode ? <X size={14} /> : <PlusCircle size={14} />}
          <span className="hidden sm:inline">{addMode ? '위치를 클릭하세요' : '기록 추가'}</span>
        </button>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <GoldMap
            records={records}
            onMapClick={handleMapClick}
            onDeleteRecord={deleteRecord}
            onEditRecord={handleEditRecord}
            addMode={addMode}
            mapRef={mapRef}
          />
          {addMode && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] bg-yellow-400 text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg pointer-events-none">
              원하는 위치를 클릭하세요
            </div>
          )}
        </div>

        {/* 데스크탑 사이드바 */}
        <aside className="w-64 bg-gray-800 border-l border-gray-700 flex-col overflow-hidden shrink-0 hidden lg:flex">
          <div className="flex border-b border-gray-700 shrink-0">
            {TABS.map(({ key, icon: Icon }) => (
              <button key={key} onClick={() => setSidebarTab(key)}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-semibold transition-colors ${sidebarTab === key ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400 hover:text-gray-200'}`}>
                <Icon size={13} />
                <span className="truncate">{tabLabel(key, records, wishlist.wishlist)}</span>
              </button>
            ))}
          </div>
          <SidebarContent {...sharedProps} />
        </aside>
      </main>

      {/* 모바일 하단 탭 바 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[1000] bg-gray-800 border-t border-gray-700 flex">
        {TABS.map(({ key, icon: Icon }) => (
          <button key={key} onClick={() => openMobilePanel(key)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold transition-colors ${mobilePanel === key ? 'text-yellow-400' : 'text-gray-400'}`}>
            <Icon size={18} />
            <span>{tabLabel(key, records, wishlist.wishlist)}</span>
          </button>
        ))}
      </div>

      {/* 모바일 바텀 시트 */}
      {mobilePanel && (
        <>
          <div className="lg:hidden fixed inset-0 z-[1001] bg-black/50" onClick={() => setMobilePanel(null)} />
          <div className="lg:hidden fixed bottom-14 left-0 right-0 z-[1002] bg-gray-800 rounded-t-2xl border-t border-gray-700 flex flex-col" style={{ height: '65vh' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
              <div className="flex gap-4">
                {TABS.map(({ key, icon: Icon }) => (
                  <button key={key} onClick={() => { setSidebarTab(key); setMobilePanel(key) }}
                    className={`flex items-center gap-1.5 text-sm font-semibold pb-1 border-b-2 transition-colors ${mobilePanel === key ? 'text-yellow-400 border-yellow-400' : 'text-gray-400 border-transparent'}`}>
                    <Icon size={14} />
                    <span>{tabLabel(key, records, wishlist.wishlist)}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setMobilePanel(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <SidebarContent {...sharedProps} tab={mobilePanel} closePanel={() => setMobilePanel(null)} />
            </div>
          </div>
        </>
      )}

      {/* 새 기록 추가 폼 */}
      {pendingPos && (
        <RecordForm position={pendingPos} onSubmit={handleFormSubmit} onClose={() => setPendingPos(null)} />
      )}

      {/* 기록 수정 폼 */}
      {editingRecord && (
        <RecordForm
          editRecord={editingRecord}
          onUpdate={handleUpdateRecord}
          onClose={() => setEditingRecord(null)}
        />
      )}
    </div>
  )
}
