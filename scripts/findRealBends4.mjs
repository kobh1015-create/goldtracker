/**
 * 굽이 탐색 v4
 * 기준:
 *  1순위 - 금광에서 가장 가까운 굽이
 *  2순위 - 하류 방향 (OSM way는 상류→하류 순으로 등록)
 *          → 광산에 가장 가까운 노드에서 하류(forward) 방향만 스캔
 *          → forward에 굽이 없으면 backward도 시도 (way 방향이 반대인 경우 대비)
 */

import https from 'https'

const RIVERS = [
  { id: 'pb1',  river: '구룡천', lat: 36.40607, lng: 126.76368, radius: 20000 },
  { id: 'pb2',  river: '응천',   lat: 36.97464, lng: 127.59163, radius: 15000 },
  { id: 'pb3',  river: '은산천', lat: 36.29866, lng: 126.81420, radius: 15000 },
  { id: 'pb4',  river: '입장천', lat: 36.91269, lng: 127.17911, radius: 15000 },
  { id: 'pb5',  river: '성환천', lat: 36.86651, lng: 127.21782, radius: 15000 },
  { id: 'pb6',  river: '무한천', lat: 36.62683, lng: 126.81703, radius: 20000 },
  { id: 'pb7',  river: '남한강', lat: 37.06029, lng: 127.76218, radius: 20000 },
  { id: 'pb8',  river: '초강천', lat: 36.22080, lng: 127.71731, radius: 15000 },
  { id: 'pb9',  river: '조양강', lat: 37.37962, lng: 128.66180, radius: 20000 },
  { id: 'pb10', river: '옥동천', lat: 37.14512, lng: 128.83848, radius: 15000 },
  { id: 'pb11', river: '홍천강', lat: 37.69670, lng: 127.88880, radius: 15000 },
  { id: 'pb12', river: '황지천', lat: 37.16379, lng: 128.98572, radius: 10000 },
  { id: 'pb13', river: '섬강',   lat: 37.31264, lng: 127.81716, radius: 15000 },
  { id: 'pb14', river: '내성천', lat: 37.05628, lng: 128.79466, radius: 15000 },
  { id: 'pb15', river: '신천',   lat: 35.76773, lng: 128.67500, radius: 15000 },
  { id: 'pb16', river: '석천',   lat: 36.30087, lng: 127.97049, radius: 20000 },
  { id: 'pb17', river: '황강',   lat: 35.71934, lng: 127.83728, radius: 15000 },
  { id: 'pb18', river: '왕피천', lat: 36.92685, lng: 129.19816, radius: 15000 },
  { id: 'pb19', river: '낙동강', lat: 36.73688, lng: 128.84141, radius: 15000 },
  { id: 'pb20', river: '원평천', lat: 35.73794, lng: 127.04133, radius: 15000 },
  { id: 'pb21', river: '주진천', lat: 35.43550, lng: 126.70210, radius: 15000 },
  { id: 'pb22', river: '섬진강', lat: 34.95038, lng: 127.62770, radius: 15000 },
  { id: 'pb23', river: '동진강', lat: 35.65171, lng: 126.93653, radius: 15000 },
  { id: 'pb24', river: '목감천', lat: 37.40609, lng: 126.86429, radius: 10000 },
  { id: 'pb25', river: '가평천', lat: 37.92665, lng: 127.51093, radius: 15000 },
  { id: 'pb26', river: '삼산천', lat: 34.48570, lng: 126.49165, radius: 15000 },
  { id: 'pb27', river: '북한강', lat: 38.07034, lng: 127.52335, radius: 15000 },
  { id: 'pb28', river: '영평천', lat: 38.01089, lng: 127.21443, radius: 15000 },
  { id: 'pb29', river: '흑천',   lat: 37.58765, lng: 127.63640, radius: 15000 },
  { id: 'pb30', river: '조령천', lat: 36.95953, lng: 127.31178, radius: 15000 },
]

function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const body = `data=${encodeURIComponent(query)}`
    const opts = {
      hostname: 'overpass-api.de', path: '/api/interpreter', method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'GoldTrackerV4/1.0',
      },
    }
    const req = https.request(opts, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error('parse: ' + data.slice(0, 80))) }
      })
    })
    req.on('error', reject)
    req.setTimeout(40000, () => { req.destroy(); reject(new Error('timeout')) })
    req.write(body); req.end()
  })
}

async function fetchWithRetry(query, retries = 2, delayMs = 6000) {
  for (let i = 0; i <= retries; i++) {
    try { return await fetchOverpass(query) }
    catch (e) {
      if (i < retries) { console.log(`  retry ${i + 1}: ${e.message}`); await sleep(delayMs) }
      else throw e
    }
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function dist(a, b) {
  const R = 6371000
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const sinDlat = Math.sin(dLat / 2), sinDlng = Math.sin(dLng / 2)
  const aa = sinDlat ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinDlng ** 2
  return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa))
}

function deflectionAngle(A, B, C) {
  const v1 = { lat: B.lat - A.lat, lng: B.lng - A.lng }
  const v2 = { lat: C.lat - B.lat, lng: C.lng - B.lng }
  const dot = v1.lat * v2.lat + v1.lng * v2.lng
  const mag1 = Math.sqrt(v1.lat ** 2 + v1.lng ** 2)
  const mag2 = Math.sqrt(v2.lat ** 2 + v2.lng ** 2)
  if (mag1 < 1e-10 || mag2 < 1e-10) return 0
  return Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2)))) * 180 / Math.PI
}

/**
 * 단일 노드 배열에서 startIdx 이후(하류) 방향으로 굽이 탐색
 * 찾은 굽이 중 광산에서 가장 가까운 것 반환
 */
function scanForBend(nodes, startIdx, mineLat, mineLng, direction = 1) {
  let best = { dist: Infinity, angle: 0, A: null, B: null, C: null }
  const mine = { lat: mineLat, lng: mineLng }

  const start = direction === 1 ? Math.max(1, startIdx) : Math.min(nodes.length - 2, startIdx)
  const end   = direction === 1 ? nodes.length - 1 : 0

  for (let i = start; direction === 1 ? i < end : i > end; i += direction) {
    const A = nodes[i - direction]
    const B = nodes[i]
    const C = nodes[i + direction]

    const dAB = dist(A, B), dBC = dist(B, C)
    if (dAB < 20 || dBC < 20 || dAB > 1500 || dBC > 1500) continue
    if (Math.max(dAB, dBC) / Math.min(dAB, dBC) > 10) continue

    const angle = deflectionAngle(A, B, C)
    if (angle < 15 || angle > 150) continue

    const distToBend = dist(mine, B)
    if (distToBend < 500 || distToBend > 20000) continue

    // 1순위: 광산에서 가장 가까운 굽이
    if (distToBend < best.dist) {
      best = { dist: distToBend, angle, A, B, C }
    }
  }
  return best.B ? best : null
}

async function findBend(river) {
  const query = `[out:json][timeout:35];(way["waterway"~"river|stream"]["name"="${river.river}"](around:${river.radius},${river.lat},${river.lng}););out geom;`
  let result
  try { result = await fetchWithRetry(query) }
  catch (e) { console.log(`${river.id} ERROR: ${e.message}`); return null }

  if (!result?.elements?.length) {
    // name:ko 시도
    const q2 = `[out:json][timeout:35];(way["waterway"~"river|stream"]["name:ko"="${river.river}"](around:${river.radius},${river.lat},${river.lng}););out geom;`
    try { result = await fetchWithRetry(q2) } catch (e) { console.log(`${river.id} NONE`); return null }
  }

  if (!result?.elements?.length) { console.log(`${river.id} NONE`); return null }

  let globalBest = { dist: Infinity, angle: 0, A: null, B: null, C: null }

  for (const way of result.elements) {
    if (!way.geometry || way.geometry.length < 3) continue
    const nodes = way.geometry.map(p => ({ lat: p.lat, lng: p.lon }))

    // 이 way에서 광산과 가장 가까운 노드 인덱스
    let closestIdx = 0, closestDist = Infinity
    for (let i = 0; i < nodes.length; i++) {
      const d = dist({ lat: river.lat, lng: river.lng }, nodes[i])
      if (d < closestDist) { closestDist = d; closestIdx = i }
    }

    // 하류 방향(forward) 우선 탐색
    const forward = scanForBend(nodes, closestIdx, river.lat, river.lng, 1)
    if (forward && forward.dist < globalBest.dist) globalBest = forward

    // forward에서 못 찾은 경우 or way 방향이 반전된 경우 → backward도 탐색
    if (!forward) {
      const backward = scanForBend(nodes, closestIdx, river.lat, river.lng, -1)
      if (backward && backward.dist < globalBest.dist) globalBest = backward
    }
  }

  if (!globalBest.B) { console.log(`${river.id} NONE (no bend)`); return null }

  const fmt = n => parseFloat(n.toFixed(5))
  const coords = [
    [fmt(globalBest.A.lat), fmt(globalBest.A.lng)],
    [fmt(globalBest.B.lat), fmt(globalBest.B.lng)],
    [fmt(globalBest.C.lat), fmt(globalBest.C.lng)],
  ]
  console.log(`${river.id} OK dist=${(globalBest.dist / 1000).toFixed(1)}km angle=${globalBest.angle.toFixed(1)}° | ${JSON.stringify(coords)}`)
  return { id: river.id, coords }
}

async function main() {
  console.log('=== 굽이 탐색 v4: 광산 최근접 + 하류 방향 ===')
  const results = []
  for (const river of RIVERS) {
    const r = await findBend(river)
    if (r) results.push(r)
    await sleep(3000)
  }
  console.log('\n=== goldData.js 업데이트용 ===')
  for (const r of results) {
    console.log(`  { id: '${r.id}', coords: ${JSON.stringify(r.coords)} },`)
  }
}

main().catch(console.error)
