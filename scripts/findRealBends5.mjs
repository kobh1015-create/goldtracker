// v4 타임아웃 9개 재시도 — 요청 간격 6초, 재시도 3회
import https from 'https'

const RIVERS = [
  { id: 'pb4',  river: '입장천', lat: 36.91269, lng: 127.17911, radius: 20000 },
  { id: 'pb8',  river: '초강천', lat: 36.22080, lng: 127.71731, radius: 20000 },
  { id: 'pb10', river: '옥동천', lat: 37.14512, lng: 128.83848, radius: 15000 },
  { id: 'pb11', river: '홍천강', lat: 37.69670, lng: 127.88880, radius: 20000 },
  { id: 'pb12', river: '황지천', lat: 37.16379, lng: 128.98572, radius: 12000 },
  { id: 'pb13', river: '섬강',   lat: 37.31264, lng: 127.81716, radius: 20000 },
  { id: 'pb20', river: '원평천', lat: 35.73794, lng: 127.04133, radius: 20000 },
  { id: 'pb27', river: '북한강', lat: 38.07034, lng: 127.52335, radius: 20000 },
  { id: 'pb28', river: '영평천', lat: 38.01089, lng: 127.21443, radius: 20000 },
]

const sleep = ms => new Promise(r => setTimeout(r, ms))

function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const body = `data=${encodeURIComponent(query)}`
    const opts = {
      hostname: 'overpass-api.de', path: '/api/interpreter', method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'GoldTrackerV5/1.0',
      },
    }
    const req = https.request(opts, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error('parse: ' + data.slice(0, 60))) }
      })
    })
    req.on('error', reject)
    req.setTimeout(45000, () => { req.destroy(); reject(new Error('timeout')) })
    req.write(body); req.end()
  })
}

async function fetchWithRetry(query, id, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try { return await fetchOverpass(query) }
    catch (e) {
      console.log(`  ${id} attempt${i + 1} fail: ${e.message}`)
      if (i < retries) await sleep(8000)
      else throw e
    }
  }
}

function dist(a, b) {
  const R = 6371000
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const s1 = Math.sin(dLat / 2), s2 = Math.sin(dLng / 2)
  const aa = s1 ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * s2 ** 2
  return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa))
}

function deflectionAngle(A, B, C) {
  const v1 = { lat: B.lat - A.lat, lng: B.lng - A.lng }
  const v2 = { lat: C.lat - B.lat, lng: C.lng - B.lng }
  const dot = v1.lat * v2.lat + v1.lng * v2.lng
  const m1 = Math.sqrt(v1.lat ** 2 + v1.lng ** 2)
  const m2 = Math.sqrt(v2.lat ** 2 + v2.lng ** 2)
  if (m1 < 1e-10 || m2 < 1e-10) return 0
  return Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2)))) * 180 / Math.PI
}

function scanBends(nodes, startIdx, mineLat, mineLng, dir = 1) {
  const mine = { lat: mineLat, lng: mineLng }
  let best = { dist: Infinity, angle: 0, A: null, B: null, C: null }
  const s = dir === 1 ? Math.max(1, startIdx) : Math.min(nodes.length - 2, startIdx)
  const e = dir === 1 ? nodes.length - 1 : 0
  for (let i = s; dir === 1 ? i < e : i > e; i += dir) {
    const A = nodes[i - dir], B = nodes[i], C = nodes[i + dir]
    const dAB = dist(A, B), dBC = dist(B, C)
    if (dAB < 20 || dBC < 20 || dAB > 1500 || dBC > 1500) continue
    if (Math.max(dAB, dBC) / Math.min(dAB, dBC) > 10) continue
    const angle = deflectionAngle(A, B, C)
    if (angle < 15 || angle > 150) continue
    const d = dist(mine, B)
    if (d > 500 && d < 20000 && d < best.dist) best = { dist: d, angle, A, B, C }
  }
  return best.B ? best : null
}

async function findBend(river) {
  const q = `[out:json][timeout:40];(way["waterway"~"river|stream"]["name"="${river.river}"](around:${river.radius},${river.lat},${river.lng}););out geom;`
  let result
  try { result = await fetchWithRetry(q, river.id) }
  catch (e) { console.log(`${river.id} ERROR: ${e.message}`); return null }

  if (!result?.elements?.length) {
    const q2 = `[out:json][timeout:40];(way["waterway"~"river|stream"]["name:ko"="${river.river}"](around:${river.radius},${river.lat},${river.lng}););out geom;`
    try { result = await fetchWithRetry(q2, river.id + '_ko') }
    catch (e) { console.log(`${river.id} NONE`); return null }
  }
  if (!result?.elements?.length) { console.log(`${river.id} NONE`); return null }

  let global = { dist: Infinity, A: null, B: null, C: null }
  for (const way of result.elements) {
    if (!way.geometry || way.geometry.length < 3) continue
    const nodes = way.geometry.map(p => ({ lat: p.lat, lng: p.lon }))
    let ci = 0, cd = Infinity
    for (let i = 0; i < nodes.length; i++) {
      const d = dist({ lat: river.lat, lng: river.lng }, nodes[i])
      if (d < cd) { cd = d; ci = i }
    }
    const fwd = scanBends(nodes, ci, river.lat, river.lng, 1)
    if (fwd && fwd.dist < global.dist) global = fwd
    if (!fwd) {
      const bwd = scanBends(nodes, ci, river.lat, river.lng, -1)
      if (bwd && bwd.dist < global.dist) global = bwd
    }
  }

  if (!global.B) { console.log(`${river.id} NONE (no bend)`); return null }
  const fmt = n => parseFloat(n.toFixed(5))
  const coords = [
    [fmt(global.A.lat), fmt(global.A.lng)],
    [fmt(global.B.lat), fmt(global.B.lng)],
    [fmt(global.C.lat), fmt(global.C.lng)],
  ]
  console.log(`${river.id} OK dist=${(global.dist / 1000).toFixed(1)}km angle=${global.angle.toFixed(1)}° | ${JSON.stringify(coords)}`)
  return { id: river.id, B: [fmt(global.B.lat), fmt(global.B.lng)], coords }
}

async function main() {
  console.log('=== v4 타임아웃 재시도 ===')
  const results = []
  for (const river of RIVERS) {
    const r = await findBend(river)
    if (r) results.push(r)
    await sleep(6000)
  }
  console.log('\n=== Point Bar coords ===')
  for (const r of results) console.log(`  { id: '${r.id}', coords: ${JSON.stringify(r.coords)} },`)
  console.log('\n=== Candidate (hot) coords ===')
  for (const r of results) console.log(`  ${r.id} → hot: lat=${r.B[0]}, lng=${r.B[1]}`)
}
main().catch(console.error)
