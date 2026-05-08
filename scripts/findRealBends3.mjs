// 최종 5개 재시도
import https from 'https'

const RIVERS = [
  { id: 'pb4',  river: '입장천', lat: 36.91269, lng: 127.17911, radius: 20000 },
  { id: 'pb6',  river: '무한천', lat: 36.62683, lng: 126.81703, radius: 20000 },
  { id: 'pb7',  river: '남한강', lat: 37.06029, lng: 127.76218, radius: 20000 },
  { id: 'pb9',  river: '조양강', lat: 37.37962, lng: 128.66180, radius: 20000 },
  { id: 'pb16', river: '석천',   lat: 36.30087, lng: 127.97049, radius: 20000 },
]

function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const body = `data=${encodeURIComponent(query)}`
    const opts = {
      hostname: 'overpass-api.de', path: '/api/interpreter', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body), 'User-Agent': 'GoldTracker/1.0' },
    }
    const req = https.request(opts, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch (e) { reject(new Error('parse: ' + data.slice(0,80))) } })
    })
    req.on('error', reject)
    req.setTimeout(40000, () => { req.destroy(); reject(new Error('timeout')) })
    req.write(body); req.end()
  })
}

function dist(a, b) {
  const R = 6371000, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180
  const sinDlat = Math.sin(dLat / 2), sinDlng = Math.sin(dLng / 2)
  const aa = sinDlat ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinDlng ** 2
  return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa))
}

function deflectionAngle(A, B, C) {
  const v1 = { lat: B.lat - A.lat, lng: B.lng - A.lng }, v2 = { lat: C.lat - B.lat, lng: C.lng - B.lng }
  const dot = v1.lat * v2.lat + v1.lng * v2.lng
  const mag1 = Math.sqrt(v1.lat ** 2 + v1.lng ** 2), mag2 = Math.sqrt(v2.lat ** 2 + v2.lng ** 2)
  if (mag1 < 1e-10 || mag2 < 1e-10) return 0
  return Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2)))) * 180 / Math.PI
}

async function findBend(river) {
  const query = `[out:json][timeout:35];(way["waterway"~"river|stream"]["name"="${river.river}"](around:${river.radius},${river.lat},${river.lng}););out geom;`
  let result
  for (let attempt = 0; attempt < 3; attempt++) {
    try { result = await fetchOverpass(query); break }
    catch (e) {
      console.log(`${river.id} attempt${attempt+1} fail: ${e.message}`)
      if (attempt < 2) await new Promise(r => setTimeout(r, 8000))
      else return null
    }
  }
  if (!result?.elements?.length) { console.log(`${river.id} NONE`); return null }

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
  const fmt = n => parseFloat(n.toFixed(5))
  const coords = [[fmt(best.A.lat), fmt(best.A.lng)], [fmt(best.B.lat), fmt(best.B.lng)], [fmt(best.C.lat), fmt(best.C.lng)]]
  console.log(`${river.id} OK angle=${best.angle.toFixed(1)}° | ${JSON.stringify(coords)}`)
  return { id: river.id, coords }
}

async function main() {
  const results = []
  for (const river of RIVERS) {
    const r = await findBend(river)
    if (r) results.push(r)
    await new Promise(res => setTimeout(res, 5000))
  }
  console.log('\n=== 결과 ===')
  for (const r of results) console.log(`{ id: '${r.id}', coords: ${JSON.stringify(r.coords)} },`)
}
main().catch(console.error)
