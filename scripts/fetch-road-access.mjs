/**
 * Overpass API(OSM)로 각 CANDIDATE 스팟에서 가장 가까운 도로까지의 거리를 조회.
 * 결과를 콘솔에 출력 → goldData.js의 roadAccess 필드로 복붙.
 *
 * 사용: node scripts/fetch-road-access.mjs
 */

const CANDIDATES = [
  { id: 'hot1',  lat: 36.40193, lng: 126.76925, name: '구봉광산 하류 구룡천'  },
  { id: 'hot2',  lat: 36.98881, lng: 127.59707, name: '무극광산 하류 응천'    },
  { id: 'hot3',  lat: 36.98985, lng: 127.59626, name: '금왕광산 하류 응천'    },
  { id: 'hot4',  lat: 36.32274, lng: 126.82949, name: '은산광산 하류 은산천'  },
  { id: 'hot5',  lat: 36.92214, lng: 127.19272, name: '직산광산 하류 입장천'  },
  { id: 'hot6',  lat: 36.86473, lng: 127.14848, name: '성거광산 하류 성환천'  },
  { id: 'hot7',  lat: 36.62366, lng: 126.79853, name: '대흥광산 하류 무한천'  },
  { id: 'hot8',  lat: 37.10277, lng: 127.81623, name: '보련광산 하류 남한강'  },
  { id: 'hot9',  lat: 36.23080, lng: 127.71530, name: '영동광산 하류 초강천'  },
  { id: 'hot10', lat: 37.38072, lng: 128.65596, name: '대성광산 하류 조양강'  },
  { id: 'hot11', lat: 37.12898, lng: 128.83124, name: '상동광산 하류 옥동천'  },
  { id: 'hot12', lat: 37.68662, lng: 127.88473, name: '보배광산 하류 홍천강'  },
  { id: 'hot13', lat: 37.15903, lng: 128.99035, name: '거도광산 하류 황지천'  },
  { id: 'hot14', lat: 37.30466, lng: 127.81015, name: '수광광산 하류 섬강'    },
  { id: 'hot15', lat: 37.00176, lng: 128.72683, name: '금정광산 하류 내성천'  },
  { id: 'hot16', lat: 35.76557, lng: 128.65456, name: '달성광산 하류 신천'    },
  { id: 'hot17', lat: 36.30290, lng: 127.97450, name: '백화광산 하류 석천'    },
  { id: 'hot18', lat: 35.74382, lng: 127.90185, name: '거창광산 하류 황강'    },
  { id: 'hot19', lat: 36.88669, lng: 129.25556, name: '쌍전광산 하류 왕피천'  },
  { id: 'hot20', lat: 36.72526, lng: 128.83971, name: '도산광산 하류 낙동강'  },
  { id: 'hot21', lat: 35.70637, lng: 127.00862, name: '모악광산 하류 원평천'  },
  { id: 'hot22', lat: 35.43970, lng: 126.62984, name: '전신광산 하류 주진천'  },
  { id: 'hot23', lat: 34.96681, lng: 127.76067, name: '광양광산 하류 섬진강'  },
  { id: 'hot24', lat: 35.64586, lng: 126.92972, name: '태인광산 하류 동진강'  },
  { id: 'hot25', lat: 37.40202, lng: 126.85533, name: '가학광산 하류 목감천'  },
  { id: 'hot26', lat: 37.92962, lng: 127.49499, name: '가평광산 하류 가평천'  },
  { id: 'hot27', lat: 34.52547, lng: 126.59430, name: '해남은적산 하류 삼산천' },
  { id: 'hot28', lat: 38.02709, lng: 127.65400, name: '화천광산 하류 북한강'  },
  { id: 'hot29', lat: 38.01410, lng: 127.20713, name: '영평광산 하류 영평천'  },
  { id: 'hot30', lat: 37.55019, lng: 127.69957, name: '단월광산 하류 흑천'    },
  { id: 'hot31', lat: 36.99956, lng: 127.30416, name: '안성금광면 하류 조령천' },
]

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// 포장도로 타입
const PAVED_TYPES  = ['motorway','trunk','primary','secondary','tertiary','unclassified','residential','service','living_street']
// 비포장 타입
const UNPAVED_TYPES = ['track','path','footway']

function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)))
}

function nearestNodeDist(lat, lng, ways) {
  let min = Infinity
  for (const way of ways) {
    if (!way.geometry) continue
    for (const node of way.geometry) {
      const d = haversineM(lat, lng, node.lat, node.lon)
      if (d < min) min = d
    }
  }
  return min === Infinity ? null : min
}

async function queryWays(lat, lng, radius, types) {
  const typeStr = types.join('|')
  const query = `[out:json][timeout:20];way(around:${radius},${lat},${lng})[highway~"^(${typeStr})$"];out geom;`
  const resp = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'GoldTracker/1.0 (sageeum-map research tool; kobh1015@gmail.com)',
      'Accept': 'application/json',
    },
    body: `data=${encodeURIComponent(query)}`,
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const json = await resp.json()
  return json.elements ?? []
}

async function getRoadAccess(spot) {
  // 1. 포장도로 500m 이내
  let ways = await queryWays(spot.lat, spot.lng, 500, PAVED_TYPES)
  if (ways.length > 0) {
    return { dist: nearestNodeDist(spot.lat, spot.lng, ways), type: 'paved' }
  }
  // 2. 포장도로 2000m 이내
  ways = await queryWays(spot.lat, spot.lng, 2000, PAVED_TYPES)
  if (ways.length > 0) {
    return { dist: nearestNodeDist(spot.lat, spot.lng, ways), type: 'paved' }
  }
  // 3. 비포장도로 2000m 이내
  ways = await queryWays(spot.lat, spot.lng, 2000, UNPAVED_TYPES)
  if (ways.length > 0) {
    return { dist: nearestNodeDist(spot.lat, spot.lng, ways), type: 'unpaved' }
  }
  return { dist: null, type: 'none' }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const results = {}

for (const spot of CANDIDATES) {
  try {
    const access = await getRoadAccess(spot)
    results[spot.id] = access
    const tag = access.type === 'paved' ? '🟢 포장' : access.type === 'unpaved' ? '🟡 비포장' : '🔴 없음'
    const distStr = access.dist != null ? `${access.dist}m` : '-'
    console.log(`${spot.id.padEnd(7)} ${tag}  ${distStr.padStart(6)}  ${spot.name}`)
  } catch (e) {
    results[spot.id] = { dist: null, type: 'error' }
    console.error(`${spot.id} 오류: ${e.message}`)
  }
  await sleep(1200) // Overpass 요청 간격
}

console.log('\n\n--- goldData.js 복붙용 ---\n')
for (const [id, v] of Object.entries(results)) {
  console.log(`  // ${id}: roadAccess: { dist: ${v.dist}, type: '${v.type}' }`)
}
