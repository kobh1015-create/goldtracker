// 각 광산 하천의 하류 합류부를 OSM waterway=confluence 태그로 탐색
// 광산 위치 기준 30km 이내 합류부 중 가장 가까운 것 선택
import https from 'https'

const MINES = [
  { id: 'c_구룡천', name: '구룡천 합류', lat: 36.40607, lng: 126.76368, river: '구룡천' },
  { id: 'c_응천',   name: '응천 합류',   lat: 36.97464, lng: 127.59163, river: '응천'   },
  { id: 'c_은산천', name: '은산천 합류', lat: 36.29866, lng: 126.81420, river: '은산천' },
  { id: 'c_입장천', name: '입장천 합류', lat: 36.91269, lng: 127.17911, river: '입장천' },
  { id: 'c_성환천', name: '성환천 합류', lat: 36.86651, lng: 127.21782, river: '성환천' },
  { id: 'c_무한천', name: '무한천 합류', lat: 36.62683, lng: 126.81703, river: '무한천' },
  { id: 'c_남한강', name: '남한강 합류', lat: 37.06029, lng: 127.76218, river: '남한강' },
  { id: 'c_초강천', name: '초강천 합류', lat: 36.22080, lng: 127.71731, river: '초강천' },
  { id: 'c_조양강', name: '조양강 합류', lat: 37.37962, lng: 128.66180, river: '조양강' },
  { id: 'c_옥동천', name: '옥동천 합류', lat: 37.14512, lng: 128.83848, river: '옥동천' },
  { id: 'c_홍천강', name: '홍천강 합류', lat: 37.69670, lng: 127.88880, river: '홍천강' },
  { id: 'c_황지천', name: '황지천 합류', lat: 37.16379, lng: 128.98572, river: '황지천' },
  { id: 'c_섬강',   name: '섬강 합류',   lat: 37.31264, lng: 127.81716, river: '섬강'   },
  { id: 'c_내성천', name: '내성천 합류', lat: 37.05628, lng: 128.79466, river: '내성천' },
  { id: 'c_신천',   name: '신천 합류',   lat: 35.76773, lng: 128.67500, river: '신천'   },
  { id: 'c_황강',   name: '황강 합류',   lat: 35.71934, lng: 127.83728, river: '황강'   },
  { id: 'c_왕피천', name: '왕피천 합류', lat: 36.92685, lng: 129.19816, river: '왕피천' },
  { id: 'c_낙동강', name: '낙동강 합류', lat: 36.73688, lng: 128.84141, river: '낙동강' },
  { id: 'c_원평천', name: '원평천 합류', lat: 35.73794, lng: 127.04133, river: '원평천' },
  { id: 'c_주진천', name: '주진천 합류', lat: 35.43550, lng: 126.70210, river: '주진천' },
  { id: 'c_섬진강', name: '섬진강 합류', lat: 34.95038, lng: 127.62770, river: '섬진강' },
  { id: 'c_동진강', name: '동진강 합류', lat: 35.65171, lng: 126.93653, river: '동진강' },
  { id: 'c_목감천', name: '목감천 합류', lat: 37.40609, lng: 126.86429, river: '목감천' },
  { id: 'c_가평천', name: '가평천 합류', lat: 37.92665, lng: 127.51093, river: '가평천' },
  { id: 'c_삼산천', name: '삼산천 합류', lat: 34.48570, lng: 126.49165, river: '삼산천' },
  { id: 'c_북한강', name: '북한강 합류', lat: 38.07034, lng: 127.52335, river: '북한강' },
  { id: 'c_영평천', name: '영평천 합류', lat: 38.01089, lng: 127.21443, river: '영평천' },
  { id: 'c_흑천',   name: '흑천 합류',   lat: 37.58765, lng: 127.63640, river: '흑천'   },
  { id: 'c_조령천', name: '조령천 합류', lat: 36.95953, lng: 127.31178, river: '조령천' },
]

const sleep = ms => new Promise(r => setTimeout(r, ms))

function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const body = `data=${encodeURIComponent(query)}`
    const opts = {
      hostname: 'overpass-api.de', path: '/api/interpreter', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body), 'User-Agent': 'GoldTrackerConf/1.0' },
    }
    const req = https.request(opts, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch (e) { reject(new Error('parse')) } })
    })
    req.on('error', reject)
    req.setTimeout(35000, () => { req.destroy(); reject(new Error('timeout')) })
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
  // OSM waterway=confluence 노드를 광산 30km 반경에서 탐색
  const query = `[out:json][timeout:30];node["waterway"="confluence"](around:30000,${mine.lat},${mine.lng});out;`
  let result
  try { result = await fetchOverpass(query) }
  catch (e) { console.log(`${mine.id} ERROR: ${e.message}`); return null }

  if (!result?.elements?.length) {
    console.log(`${mine.id} NONE`)
    return null
  }

  // 광산에서 가장 가까운 합류부 선택 (단 최소 1km 이상 — 광산 바로 옆은 아닐것)
  const mine_pt = { lat: mine.lat, lng: mine.lng }
  let best = null, bestDist = Infinity
  for (const el of result.elements) {
    const d = dist(mine_pt, { lat: el.lat, lng: el.lon })
    if (d > 1000 && d < bestDist) { bestDist = d; best = el }
  }

  if (!best) { console.log(`${mine.id} NONE (too close or empty)`); return null }

  const lat = parseFloat(best.lat.toFixed(5))
  const lng = parseFloat(best.lon.toFixed(5))
  const distKm = (bestDist / 1000).toFixed(1)
  const nameTag = best.tags?.name || best.tags?.['name:ko'] || ''
  console.log(`${mine.id} OK dist=${distKm}km | ${lat},${lng} name="${nameTag}"`)
  return { id: mine.id, name: mine.name, lat, lng, dist: bestDist, nameTag }
}

async function main() {
  console.log('=== 광산별 하류 합류부 탐색 ===')
  const results = []
  for (const mine of MINES) {
    const r = await findConfluence(mine)
    if (r) results.push(r)
    await sleep(2500)
  }

  console.log('\n=== 결과 요약 ===')
  for (const r of results) {
    console.log(`  { id: '${r.id}', name: '${r.nameTag || r.name}', lat: ${r.lat}, lng: ${r.lng} },`)
  }
}
main().catch(console.error)
