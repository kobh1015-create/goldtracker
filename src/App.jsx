import { useMemo, useState } from 'react'
import { Map, Pickaxe, Waves, GitMerge, Star, PlusCircle, BookOpen, BarChart2, X, LogOut } from 'lucide-react'
import GoldMap from './components/Map/GoldMap'
import RecordForm from './components/RecordForm'
import RecordList from './components/Sidebar/RecordList'
import AccessGate from './components/AccessGate'
import { useAuth } from './hooks/useAuth'
import { MINES, POINT_BARS, CONFLUENCES, CANDIDATES } from './data/goldData'
import { scoreLocation, gradeColor } from './utils/goldAnalysis'
import { useRecords } from './hooks/useRecords'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-yellow-400 text-sm animate-pulse">확인 중...</div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-gray-700 rounded-lg p-3 flex items-center gap-3">
      <Icon size={18} color={color} />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-lg font-bold" style={{ color }}>{value}</p>
      </div>
    </div>
  )
}

export default function App() {
  const { status, verify, logout } = useAuth()
  const { records, addRecord, deleteRecord } = useRecords()
  const [pendingPos, setPendingPos]   = useState(null)
  const [addMode, setAddMode]         = useState(false)
  const [sidebarTab, setSidebarTab]   = useState('analysis')

  const hotspots = useMemo(() =>
    CANDIDATES
      .map(c => ({
        ...c,
        analysis: scoreLocation(c.lat, c.lng, { mines: MINES, pointBars: POINT_BARS, confluences: CONFLUENCES }),
      }))
      .sort((a, b) => b.analysis.total - a.analysis.total)
  , [])

  if (status === 'checking')      return <LoadingScreen />
  if (status === 'unauthorized')  return <AccessGate onVerify={verify} />

  const handleMapClick = (pos) => {
    if (!addMode) return
    setPendingPos(pos)
    setAddMode(false)
  }

  const handleFormSubmit = (data) => {
    addRecord(data)
    setPendingPos(null)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="flex items-center gap-3 px-4 py-2.5 bg-gray-800 border-b border-yellow-700 shadow-md shrink-0">
        <Map className="text-yellow-400" size={22} />
        <h1 className="text-lg font-bold text-yellow-400 tracking-wide">GoldTracker</h1>
        <span className="text-xs text-gray-400 hidden sm:block">한국 사금 탐사 지도</span>

        {/* 로그아웃 */}
        <button
          onClick={logout}
          className="ml-auto text-gray-500 hover:text-gray-300 transition-colors"
          title="로그아웃"
        >
          <LogOut size={16} />
        </button>

        {/* 기록 추가 버튼 */}
        <button
          onClick={() => setAddMode(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            addMode
              ? 'bg-yellow-400 text-gray-900 shadow-lg shadow-yellow-400/30'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {addMode ? <X size={14} /> : <PlusCircle size={14} />}
          {addMode ? '위치를 클릭하세요' : '기록 추가'}
        </button>

        <div className="ml-3 flex items-center gap-3 text-xs text-gray-400">
          <span className="items-center gap-1 hidden xl:flex">
            <span className="w-3 h-3 rounded-full bg-amber-700 border border-yellow-400 inline-block" />폐광산
          </span>
          <span className="items-center gap-1 hidden xl:flex">
            <span className="w-4 h-1.5 rounded-full bg-green-500 inline-block" />Point Bar
          </span>
          <span className="items-center gap-1 hidden xl:flex">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />합류부
          </span>
          <span className="items-center gap-1 hidden xl:flex">
            <span className="w-4 h-4 rotate-45 bg-yellow-400 border-2 border-amber-700 inline-block" />내 기록
          </span>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <GoldMap
            records={records}
            onMapClick={handleMapClick}
            onDeleteRecord={deleteRecord}
            addMode={addMode}
          />
          {addMode && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[1000] bg-yellow-400 text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg pointer-events-none">
              원하는 위치를 클릭하세요
            </div>
          )}
        </div>

        <aside className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden shrink-0 hidden lg:flex">
          {/* 탭 */}
          <div className="flex border-b border-gray-700">
            {[
              { key: 'analysis', label: '분석', icon: BarChart2 },
              { key: 'records',  label: `기록 (${records.length})`, icon: BookOpen },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSidebarTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                  sidebarTab === key
                    ? 'text-yellow-400 border-b-2 border-yellow-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon size={13} />{label}
              </button>
            ))}
          </div>

          {sidebarTab === 'analysis' ? (
            <>
              <div className="p-3 grid grid-cols-2 gap-2 border-b border-gray-700">
                <StatCard icon={Pickaxe}  label="폐광산"    value={MINES.length}       color="#fbbf24" />
                <StatCard icon={Waves}    label="Point Bar" value={POINT_BARS.length}  color="#22c55e" />
                <StatCard icon={GitMerge} label="합류부"    value={CONFLUENCES.length} color="#60a5fa" />
                <StatCard icon={Star}     label="분석 스팟" value={CANDIDATES.length}  color="#f97316" />
              </div>
              <div className="px-3 py-2 border-b border-gray-700">
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">유망도 순위</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {hotspots.map((h, i) => {
                  const color = gradeColor(h.analysis.total)
                  return (
                    <div key={h.id} className="px-3 py-2.5 border-b border-gray-700/50 hover:bg-gray-700/40">
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
                  )
                })}
              </div>
              <div className="p-3 border-t border-gray-700 text-xs text-gray-500 leading-relaxed">
                <p className="font-semibold text-gray-400 mb-1">점수 산정 기준</p>
                <p>폐광산(40) + Point Bar(35) + 합류부(15) + 복합보너스(10)</p>
              </div>
            </>
          ) : (
            <RecordList records={records} onDelete={deleteRecord} />
          )}
        </aside>
      </main>

      {pendingPos && (
        <RecordForm
          position={pendingPos}
          onSubmit={handleFormSubmit}
          onClose={() => setPendingPos(null)}
        />
      )}
    </div>
  )
}
