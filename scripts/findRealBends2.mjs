// 1차에서 실패한 강들만 재시도 (딜레이 3초)
import https from 'https'

const RIVERS = [
  { id: 'pb3',  name: '은산천 굽이',  river: '은산천', lat: 36.29866, lng: 126.81420, radius: 15000 },
  { id: 'pb4',  name: '입장천 굽이',  river: '입장천', lat: 36.91269, lng: 127.17911, radius: 15000 },
  { id: 'pb5',  name: '성환천 굽이',  river: '성환천', lat: 36.86651, lng: 127.21782, radius: 15000 },
  { id: 'pb6',  name: '무한천 굽이',  river: '무한천', lat: 36.62683, lng: 126.81703, radius: 15000 },
  { id: 'pb7',  name: '남한강 굽이',  river: '남한강', lat: 37.06029, lng: 127.76218, radius: 15000 },
  { id: 'pb8',  name: '초강천 굽이',  river: '초강천', lat: 36.22080, lng: 127.71731, radius: 15000 },
  { id: 'pb9',  name: '조양강 굽이',  river: '조양강', lat: 37.37962, lng: 128.66180, radius: 15000 },
  { id: 'pb14', name: '내성천 굽이',  river: '내성천', lat: 37.05628, lng: 128.79466, radius: 15000 },
  { id: 'pb15', name: '신천 굽이',    river: '신천',   lat: 35.76773, lng: 128.67500, radius: 15000 },
  { id: 'pb16', name: '석천 굽이',    river: '석천',   lat: 36.30087, lng: 127.97049, radius: 15000 },
  { id: 'pb18', name: '왕피천 굽이',  river: '왕피천', lat: 36.92685, lng: 129.19816, radius: 15000 },
  { id: 'pb19', name: '낙동강 굽이',  river: '낙동강', lat: 36.73688, lng: 128.84141, radius: 15000 },
  { id: 'pb23', name: '동진강 굽이',  river: '동진강', lat: 35.65171, lng: 126.93653, radius: 15000 },
  { id: 'pb25', name: '가평천 굽이',  river: '가평천', lat: 37.92665, lng: 127.51093, radius: 15000 },
  { id: 'pb26', name: '삼산천 굽이',  river: '삼산천', lat: 34.48570, lng: 126.49165, radius: 15000 },
  { id: 'pb28', name: '영평천 굽이',  river: '영평천', lat: 38.01089, lng: 127.21443, radius: 15000 },
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
        catch (e) { reject(new Error('parse error: ' + data.slice(0, 80))) }
      })
    })
    req.on('error', reject)
    req.setTimeout(35000, () => { req.destroy(); reject(new Error('timeout')) })
    req.write(body)
    req.end()
  })
}

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

async function fetchWithRetry(query, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchOverpass(query)
    } catch (e) {
      if (i < retries) {
        await new Promise(r => setTimeout(r, 5000))
      } else {
        throw e
      }
    }
  }
}

async function findBend(river) {
  const query = `[out:json][timeout:30];(way["waterway"~"river|stream"]["name"="${river.river}"](around:${river.radius},${river.lat},${river.lng}););out geom;`
  let result
  try {
    result = await fetchWithRetry(query)
  } catch (e) {
    console.log(`${river.id} ERROR: ${e.message}`)
    return null
  }

  if (!result.elements || result.elements.length === 0) {
    const q2 = `[out:json][timeout:30];(way["waterway"~"river|stream"]["name:ko"="${river.river}"](around:${river.radius},${river.lat},${river.lng}););out geom;`
    try { result = await fetchWithRetry(q2) } catch (e) {
      console.log(`${river.id} ERROR fallback: ${e.message}`)
      return null
    }
  }

  if (!result.elements || result.elements.length === 0) {
    console.log(`${river.id} NONE`)
    return null
  }

  let best = { angle: 0, A: null, B: null, C: null }
  for (const way of result.elements) {
    if (!way.geometry || way.geometry.length < 3) continue
    const nodes = way.geometry.map(p => ({ lat: p.lat, lng: p.lon }))
    for (let i = 1; i < nodes.length - 1; i++) {
      const A = nodes[i - 1], B = nodes[i], C = nodes[i + 1]
      const dAB = dist(A, B), dBC = dist(B, C)
      if (dAB < 20 || dBC < 20 || dAB > 1500 || dBC > 1500) continue
      if (Math.max(dAB, dBC) / Math.min(dAB, dBC) > 10) continue
      const angle = deflectionAngle(A, B, C)
      if (angle >= 15 && angle <= 150 && angle > best.angle) {
        const d = dist({ lat: river.lat, lng: river.lng }, B)
        if (d > 500 && d < 20000) best = { angle, A, B, C }
      }
    }
  }

  if (!best.B) { console.log(`${river.id} NONE (no bend)`); return null }

  const fmt = (n) => parseFloat(n.toFixed(5))
  const coords = [[fmt(best.A.lat), fmt(best.A.lng)], [fmt(best.B.lat), fmt(best.B.lng)], [fmt(best.C.lat), fmt(best.C.lng)]]
  console.log(`${river.id} OK angle=${best.angle.toFixed(1)}° | ${JSON.stringify(coords)}`)
  return { id: river.id, coords }
}

async function main() {
  console.log('=== 재시도 ===')
  const results = []
  for (const river of RIVERS) {
    const r = await findBend(river)
    if (r) results.push(r)
    await new Promise(res => setTimeout(res, 3000))
  }
  console.log('\n=== goldData.js 업데이트용 ===')
  for (const r of results) {
    console.log(`{ id: '${r.id}', coords: ${JSON.stringify(r.coords)} },`)
  }
}
main().catch(console.error)
