/**
 * 실제 굽이 탐색: Overpass API에서 강 전체 geometry를 받아
 * 연속 세 노드 사이의 방향 변화각(curvature)이 가장 큰 지점을 찾는다.
 *
 * 사용: node scripts/findRealBends.mjs
 */

import https from 'https'

// 각 광산에 연결된 강 이름과 탐색 중심 좌표 (광산 위치)
const RIVERS = [
  { id: 'pb1',  name: '구룡천 굽이',  river: '구룡천', lat: 36.40607, lng: 126.76368, radius: 20000 },
  { id: 'pb2',  name: '응천 굽이',    river: '응천',   lat: 36.97464, lng: 127.59163, radius: 15000 },
  { id: 'pb3',  name: '은산천 굽이',  river: '은산천', lat: 36.29866, lng: 126.81420, radius: 15000 },
  { id: 'pb4',  name: '입장천 굽이',  river: '입장천', lat: 36.91269, lng: 127.17911, radius: 15000 },
  { id: 'pb5',  name: '성환천 굽이',  river: '성환천', lat: 36.86651, lng: 127.21782, radius: 15000 },
  { id: 'pb6',  name: '무한천 굽이',  river: '무한천', lat: 36.62683, lng: 126.81703, radius: 15000 },
  { id: 'pb7',  name: '남한강 굽이',  river: '남한강', lat: 37.06029, lng: 127.76218, radius: 15000 },
  { id: 'pb8',  name: '초강천 굽이',  river: '초강천', lat: 36.22080, lng: 127.71731, radius: 15000 },
  { id: 'pb9',  name: '조양강 굽이',  river: '조양강', lat: 37.37962, lng: 128.66180, radius: 15000 },
  { id: 'pb10', name: '옥동천 굽이',  river: '옥동천', lat: 37.14512, lng: 128.83848, radius: 15000 },
  { id: 'pb11', name: '홍천강 굽이',  river: '홍천강', lat: 37.69670, lng: 127.88880, radius: 15000 },
  { id: 'pb12', name: '황지천 굽이',  river: '황지천', lat: 37.16379, lng: 128.98572, radius: 10000 },
  { id: 'pb13', name: '섬강 굽이',    river: '섬강',   lat: 37.31264, lng: 127.81716, radius: 15000 },
  { id: 'pb14', name: '내성천 굽이',  river: '내성천', lat: 37.05628, lng: 128.79466, radius: 15000 },
  { id: 'pb15', name: '신천 굽이',    river: '신천',   lat: 35.76773, lng: 128.67500, radius: 15000 },
  { id: 'pb16', name: '석천 굽이',    river: '석천',   lat: 36.30087, lng: 127.97049, radius: 15000 },
  { id: 'pb17', name: '황강 굽이',    river: '황강',   lat: 35.71934, lng: 127.83728, radius: 15000 },
  { id: 'pb18', name: '왕피천 굽이',  river: '왕피천', lat: 36.92685, lng: 129.19816, radius: 15000 },
  { id: 'pb19', name: '낙동강 굽이',  river: '낙동강', lat: 36.73688, lng: 128.84141, radius: 15000 },
  { id: 'pb20', name: '원평천 굽이',  river: '원평천', lat: 35.73794, lng: 127.04133, radius: 15000 },
  { id: 'pb21', name: '주진천 굽이',  river: '주진천', lat: 35.43550, lng: 126.70210, radius: 15000 },
  { id: 'pb22', name: '섬진강 굽이',  river: '섬진강', lat: 34.95038, lng: 127.62770, radius: 15000 },
  { id: 'pb23', name: '동진강 굽이',  river: '동진강', lat: 35.65171, lng: 126.93653, radius: 15000 },
  { id: 'pb24', name: '목감천 굽이',  river: '목감천', lat: 37.40609, lng: 126.86429, radius: 10000 },
  { id: 'pb25', name: '가평천 굽이',  river: '가평천', lat: 37.92665, lng: 127.51093, radius: 15000 },
  { id: 'pb26', name: '삼산천 굽이',  river: '삼산천', lat: 34.48570, lng: 126.49165, radius: 15000 },
  { id: 'pb27', name: '북한강 굽이',  river: '북한강', lat: 38.07034, lng: 127.52335, radius: 15000 },
  { id: 'pb28', name: '영평천 굽이',  river: '영평천', lat: 38.01089, lng: 127.21443, radius: 15000 },
  { id: 'pb29', name: '흑천 굽이',    river: '흑천',   lat: 37.58765, lng: 127.63640, radius: 15000 },
  { id: 'pb30', name: '조령천 굽이',  river: '조령천', lat: 36.95953, lng: 127.31178, radius: 15000 },
]

function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const body = `data=${encodeURIComponent(query)}`
    const opts = {
      hostname: 'overpass-api.de',
      path: '/api/interpreter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'GoldTrackerBendFinder/1.0',
      },
    }
    const req = https.request(opts, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')) })
    req.write(body)
    req.end()
  })
}

// 두 점 사이 거리 (m)
function dist(a, b) {
  const R = 6371000
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const sinDlat = Math.sin(dLat / 2)
  const sinDlng = Math.sin(dLng / 2)
  const aa = sinDlat * sinDlat + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinDlng * sinDlng
  return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa))
}

// 세 점 A-B-C에서 B의 방향 변화각 (0°=직선, 180°=완전 U턴)
function deflectionAngle(A, B, C) {
  const v1 = { lat: B.lat - A.lat, lng: B.lng - A.lng }
  const v2 = { lat: C.lat - B.lat, lng: C.lng - B.lng }
  const dot = v1.lat * v2.lat + v1.lng * v2.lng
  const mag1 = Math.sqrt(v1.lat ** 2 + v1.lng ** 2)
  const mag2 = Math.sqrt(v2.lat ** 2 + v2.lng ** 2)
  if (mag1 < 1e-10 || mag2 < 1e-10) return 0
  const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)))
  // deflection angle: 0=직선, 90=직각, 180=U턴
  return Math.acos(cosAngle) * 180 / Math.PI
}

async function findBend(river) {
  // 강 이름으로 해당 반경 내 waterway way를 가져온다
  const query = `
[out:json][timeout:25];
(
  way["waterway"~"river|stream"]["name"="${river.river}"](around:${river.radius},${river.lat},${river.lng});
);
out geom;`

  let result
  try {
    result = await fetchOverpass(query)
  } catch (e) {
    console.error(`${river.id} ERROR: ${e.message}`)
    return null
  }

  if (!result.elements || result.elements.length === 0) {
    // name 검색 실패시 name:ko 시도
    const query2 = `
[out:json][timeout:25];
(
  way["waterway"~"river|stream"]["name:ko"="${river.river}"](around:${river.radius},${river.lat},${river.lng});
);
out geom;`
    try {
      result = await fetchOverpass(query2)
    } catch (e) {
      console.error(`${river.id} ERROR (fallback): ${e.message}`)
      return null
    }
  }

  if (!result.elements || result.elements.length === 0) {
    console.log(`${river.id} NONE (no river way found)`)
    return null
  }

  // 모든 way의 geometry를 하나의 노드 배열로 합친다
  const allNodes = []
  for (const way of result.elements) {
    if (!way.geometry) continue
    for (const pt of way.geometry) {
      allNodes.push({ lat: pt.lat, lng: pt.lon })
    }
  }

  // 각 way를 독립적으로 처리 → way 경계에서 생기는 점프(아티팩트) 방지
  let best = { angle: 0, A: null, B: null, C: null }

  for (const way of result.elements) {
    if (!way.geometry || way.geometry.length < 3) continue
    const nodes = way.geometry.map(p => ({ lat: p.lat, lng: p.lon }))

    for (let i = 1; i < nodes.length - 1; i++) {
      const A = nodes[i - 1]
      const B = nodes[i]
      const C = nodes[i + 1]

      const dAB = dist(A, B)
      const dBC = dist(B, C)

      // 노드 간 거리가 너무 짧거나(GPS 노이즈) 너무 길면(직선 대하천) 건너뜀
      // 실제 굽이의 호 길이: 20m ~ 1500m
      if (dAB < 20 || dBC < 20 || dAB > 1500 || dBC > 1500) continue
      // 두 구간 길이 비가 10배 이상이면 아티팩트
      if (Math.max(dAB, dBC) / Math.min(dAB, dBC) > 10) continue

      const angle = deflectionAngle(A, B, C)

      // 15°~150° 범위의 실제 굽이만 인정 (>150°는 U턴 아티팩트 가능성)
      if (angle >= 15 && angle <= 150 && angle > best.angle) {
        // 광산과의 거리 확인 (500m~20km 사이)
        const d = dist({ lat: river.lat, lng: river.lng }, B)
        if (d > 500 && d < 20000) {
          best = { angle, A, B, C }
        }
      }
    }
  }

  if (!best.B) {
    console.log(`${river.id} NONE (no valid bend found)`)
    return null
  }

  const fmt = (n, d) => n.toFixed(d)
  const coords = [
    [parseFloat(fmt(best.A.lat, 5)), parseFloat(fmt(best.A.lng, 5))],
    [parseFloat(fmt(best.B.lat, 5)), parseFloat(fmt(best.B.lng, 5))],
    [parseFloat(fmt(best.C.lat, 5)), parseFloat(fmt(best.C.lng, 5))],
  ]
  console.log(`${river.id} OK angle=${fmt(best.angle, 1)}° | ${JSON.stringify(coords)}`)
  return { id: river.id, coords }
}

async function main() {
  console.log('=== 실제 굽이 탐색 시작 ===')
  const results = []

  for (const river of RIVERS) {
    const r = await findBend(river)
    if (r) results.push(r)
    // API 부하 방지
    await new Promise(res => setTimeout(res, 1500))
  }

  console.log('\n=== goldData.js 업데이트용 출력 ===')
  for (const r of results) {
    console.log(`{ id: '${r.id}', coords: ${JSON.stringify(r.coords)} },`)
  }
}

main().catch(console.error)
