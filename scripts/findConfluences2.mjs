/**
 * 합류부 탐색 v2
 * waterway=confluence 태그 대신, 두 개 이상의 다른 이름 하천 way가
 * 공유하는 노드를 직접 찾아서 합류점 좌표로 사용한다.
 *
 * 알고리즘:
 * 1. 광산 주변 30km 내 모든 waterway(river/stream) way를 가져옴
 * 2. node_id → [way names] 역인덱스 구성
 * 3. 두 개 이상의 서로 다른 이름 하천이 공유하는 노드 = 합류점
 * 4. 그 중 광산에서 가장 가까운 합류점 선택 (최소 1km)
 */

import https from 'https'

const MINES = [
  { id: 'c1',  label: '구룡천',  mineLat: 36.40607, mineLng: 126.76368, radius: 25000 },
  { id: 'c2',  label: '응천',    mineLat: 36.97464, mineLng: 127.59163, radius: 25000 },
  { id: 'c3',  label: '은산천',  mineLat: 36.29866, mineLng: 126.81420, radius: 25000 },
  { id: 'c4',  label: '입장천',  mineLat: 36.91269, mineLng: 127.17911, radius: 25000 },
  { id: 'c5',  label: '성환천',  mineLat: 36.86651, mineLng: 127.21782, radius: 25000 },
  { id: 'c6',  label: '무한천',  mineLat: 36.62683, mineLng: 126.81703, radius: 25000 },
  { id: 'c7',  label: '남한강',  mineLat: 37.06029, mineLng: 127.76218, radius: 25000 },
  { id: 'c8',  label: '초강천',  mineLat: 36.22080, mineLng: 127.71731, radius: 25000 },
  { id: 'c9',  label: '조양강',  mineLat: 37.37962, mineLng: 128.66180, radius: 25000 },
  { id: 'c10', label: '옥동천',  mineLat: 37.14512, mineLng: 128.83848, radius: 25000 },
  { id: 'c11', label: '홍천강',  mineLat: 37.69670, mineLng: 127.88880, radius: 25000 },
  { id: 'c12', label: '황지천',  mineLat: 37.16379, mineLng: 128.98572, radius: 25000 },
  { id: 'c13', label: '섬강',    mineLat: 37.31264, mineLng: 127.81716, radius: 25000 },
  { id: 'c14', label: '내성천',  mineLat: 37.05628, mineLng: 128.79466, radius: 30000 },
  { id: 'c15', label: '신천',    mineLat: 35.76773, mineLng: 128.67500, radius: 25000 },
  { id: 'c16', label: '황강',    mineLat: 35.71934, mineLng: 127.83728, radius: 30000 },
  { id: 'c17', label: '원평천',  mineLat: 35.73794, mineLng: 127.04133, radius: 25000 },
  { id: 'c18', label: '가평천',  mineLat: 37.92665, mineLng: 127.51093, radius: 25000 },
  { id: 'c19', label: '영평천',  mineLat: 38.01089, mineLng: 127.21443, radius: 30000 },
  { id: 'c20', label: '흑천',    mineLat: 37.58765, mineLng: 127.63640, radius: 25000 },
  { id: 'c21', label: '목감천',  mineLat: 37.40609, mineLng: 126.86429, radius: 20000 },
]

const sleep = ms => new Promise(r => setTimeout(r, ms))

function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const body = `data=${encodeURIComponent(query)}`
    const opts = {
      hostname: 'overpass-api.de', path: '/api/interpreter', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body), 'User-Agent': 'GoldTrackerConf2/1.0' },
    }
    const req = https.request(opts, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch (e) { reject(new Error('parse: ' + data.slice(0, 60))) } })
    })
    req.on('error', reject)
    req.setTimeout(40000, () => { req.destroy(); reject(new Error('timeout')) })
    req.write(body); req.end()
  })
}

function dist(a, b) {
  const R = 6371000, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180
  const s1 = Math.sin(dLat / 2), s2 = Math.sin(dLng / 2)
  const aa = s1 ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * s2 ** 2
  return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa))
}

async function findConfluence(mine) {
  // 모든 waterway way + 노드 geometry를 한 번에 가져옴
  const query = `[out:json][timeout:35];(way["waterway"~"river|stream"](around:${mine.radius},${mine.mineLat},${mine.mineLng}););out geom;`
  let result
  for (let attempt = 0; attempt < 3; attempt++) {
    try { result = await fetchOverpass(query); break }
    catch (e) {
      if (attempt < 2) { console.log(`  ${mine.id} retry${attempt+1}: ${e.message}`); await sleep(6000) }
      else { console.log(`${mine.id} ERROR: ${e.message}`); return null }
    }
  }

  if (!result?.elements?.length) { console.log(`${mine.id} NONE`); return null }

  // nodeId → Set of river names 역인덱스
  const nodeNames = new Map()   // nodeId → Set<name>
  const nodeCoords = new Map()  // nodeId → {lat, lng}

  for (const way of result.elements) {
    if (!way.geometry) continue
    const name = way.tags?.name || way.tags?.['name:ko'] || null
    if (!name) continue

    for (const pt of way.geometry) {
      const key = `${pt.lat.toFixed(6)},${pt.lon.toFixed(6)}`
      if (!nodeNames.has(key)) nodeNames.set(key, new Set())
      nodeNames.get(key).add(name)
      if (!nodeCoords.has(key)) nodeCoords.set(key, { lat: pt.lat, lng: pt.lon })
    }
  }

  // 두 개 이상 다른 이름이 공유하는 노드 = 합류점
  const mine_pt = { lat: mine.mineLat, lng: mine.mineLng }
  let best = { dist: Infinity, lat: null, lng: null, names: null }

  for (const [key, names] of nodeNames.entries()) {
    if (names.size < 2) continue
    const coord = nodeCoords.get(key)
    const d = dist(mine_pt, coord)
    if (d < 1000 || d > mine.radius) continue   // 최소 1km, 최대 반경 내
    if (d < best.dist) {
      best = { dist: d, lat: coord.lat, lng: coord.lng, names: [...names] }
    }
  }

  if (!best.lat) { console.log(`${mine.id} NONE (no junction)`); return null }

  const lat = parseFloat(best.lat.toFixed(5))
  const lng = parseFloat(best.lng.toFixed(5))
  const rivers = best.names.join('+')
  console.log(`${mine.id} OK dist=${(best.dist/1000).toFixed(1)}km | ${lat},${lng} [${rivers}]`)
  return { id: mine.id, label: mine.label, lat, lng, rivers: best.names }
}

async function main() {
  console.log('=== 합류부 탐색 v2: 공유노드 방식 ===')
  const results = []
  for (const mine of MINES) {
    const r = await findConfluence(mine)
    if (r) results.push(r)
    await sleep(4000)
  }

  console.log('\n=== goldData.js CONFLUENCES 업데이트용 ===')
  for (const r of results) {
    const rivers = JSON.stringify(r.rivers)
    console.log(`  { id: '${r.id}', name: '${r.rivers.join('+')} 합류', lat: ${r.lat}, lng: ${r.lng}, rivers: ${rivers} },`)
  }
}
main().catch(console.error)
