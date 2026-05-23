// 두 좌표 간 직선거리 (km) - Haversine 공식
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const SCORE_WEIGHTS = {
  mineProximity: 35,  // 폐광산 근접도: 금맥 공급원 존재 가능성
  pointBar: 30,       // Point Bar 위치: 비중 퇴적 최적 구간
  confluence: 15,     // 합류부 근접도: 유속 급감으로 퇴적 촉진
  roadAccess: 10,     // 차량 접근성: 포장도로까지의 거리
  bonus: 10,          // 복수 요인 동시 충족 시 보너스
}

/**
 * 특정 좌표의 사금 유망도를 0~100으로 점수화
 * @param {number} lat
 * @param {number} lng
 * @param {{ mines, pointBars, confluences, roadAccess }} data
 * @returns {{ total: number, grade: string, breakdown: Array }}
 */
export function scoreLocation(lat, lng, { mines, pointBars, confluences, roadAccess }) {
  const breakdown = []
  let total = 0

  // 1. 차량 접근성 (max 10pt) — roadAccess.dist(m) 기준
  // 300m 이내 포장도로: 만점 / 1500m 초과 or 비포장: 최저
  if (roadAccess) {
    let roadScore = 0
    const { dist, type } = roadAccess
    if (type === 'paved') {
      if (dist <= 300)       roadScore = 10
      else if (dist <= 700)  roadScore = Math.round(10 - (dist - 300) / 400 * 5)   // 10→5
      else if (dist <= 1500) roadScore = Math.round(5  - (dist - 700) / 800 * 3)   // 5→2
      else                   roadScore = 1
    } else {
      // 비포장: 거리 무관 최대 3점
      roadScore = dist <= 500 ? 3 : dist <= 1000 ? 2 : 1
    }
    roadScore = Math.max(0, roadScore)
    const distLabel = dist >= 1000 ? `${(dist / 1000).toFixed(1)}km` : `${dist}m`
    const typeLabel = type === 'paved' ? '포장도로' : '비포장도로'
    breakdown.push({
      factor: '차량 접근성',
      score: roadScore,
      max: 10,
      detail: `${typeLabel} ${distLabel}`,
    })
    total += roadScore
  }

  // 2. 폐광산 근접도 (max 35pt)
  // 3km 이내 만점, 15km 밖 0점 — 멀수록 금이 희석되므로 가중치 급감
  let mineScore = 0
  let nearest = { mine: null, dist: Infinity }
  for (const mine of mines) {
    const d = haversineKm(lat, lng, mine.lat, mine.lng)
    if (d < nearest.dist) nearest = { mine, dist: d }
  }
  if (nearest.mine && nearest.dist < 15) {
    if (nearest.dist < 3)       mineScore = 35
    else if (nearest.dist < 8)  mineScore = Math.round(35 - (nearest.dist - 3) / 5 * 22)
    else                        mineScore = Math.round(13 - (nearest.dist - 8) / 7 * 13)
    // 2순위 광산(Cu-Au)은 금 농도가 낮으므로 60% 적용
    const rankMultiplier = nearest.mine.goldRank === 1 ? 1.0 : 0.6
    mineScore = Math.max(0, Math.round(mineScore * rankMultiplier))
    const rankLabel = nearest.mine.goldRank === 1 ? '금 주산물' : '금 부산물'
    breakdown.push({
      factor: '폐광산 근접',
      score: mineScore,
      max: 35,
      detail: `${nearest.mine.name} (${nearest.dist.toFixed(1)}km, ${rankLabel})`,
    })
    total += mineScore
  }

  // 3. Point Bar 근접도 (max 30pt)
  // 폴리라인의 각 꼭짓점까지 거리 중 최솟값 사용. 500m 이내면 만점.
  let pbScore = 0
  let nearestPb = { pb: null, dist: Infinity }
  for (const pb of pointBars) {
    for (const [plat, plng] of pb.coords) {
      const d = haversineKm(lat, lng, plat, plng)
      if (d < nearestPb.dist) nearestPb = { pb, dist: d }
    }
  }
  if (nearestPb.pb && nearestPb.dist < 5) {
    if (nearestPb.dist < 0.5) pbScore = 30
    else pbScore = Math.round(30 * (1 - (nearestPb.dist - 0.5) / 4.5))
    pbScore = Math.max(0, pbScore)
    breakdown.push({
      factor: 'Point Bar',
      score: pbScore,
      max: 30,
      detail: `${nearestPb.pb.name} (${(nearestPb.dist * 1000).toFixed(0)}m)`,
    })
    total += pbScore
  }

  // 4. 합류부 근접도 (max 15pt)
  // 1km 이내 만점, 10km 밖 0점.
  let confScore = 0
  let nearestConf = { conf: null, dist: Infinity }
  for (const conf of confluences) {
    const d = haversineKm(lat, lng, conf.lat, conf.lng)
    if (d < nearestConf.dist) nearestConf = { conf, dist: d }
  }
  if (nearestConf.conf && nearestConf.dist < 10) {
    if (nearestConf.dist < 1) confScore = 15
    else confScore = Math.round(15 * (1 - (nearestConf.dist - 1) / 9))
    confScore = Math.max(0, confScore)
    breakdown.push({
      factor: '합류부 근접',
      score: confScore,
      max: 15,
      detail: `${nearestConf.conf.name} (${nearestConf.dist.toFixed(1)}km)`,
    })
    total += confScore
  }

  // 5. 복수 요인 보너스 (max 10pt)
  // 도로 제외 3개 요인(광산·PB·합류부) 모두 충족 시 +10, 2개 +5
  const goldFactors = breakdown.filter(b => ['폐광산 근접','Point Bar','합류부 근접'].includes(b.factor)).length
  if (goldFactors === 3) {
    breakdown.push({ factor: '복합 요인 보너스', score: 10, max: 10, detail: '3개 요인 동시 충족' })
    total += 10
  } else if (goldFactors === 2) {
    breakdown.push({ factor: '복합 요인 보너스', score: 5, max: 10, detail: '2개 요인 동시 충족' })
    total += 5
  }

  total = Math.min(100, Math.round(total))

  return {
    total,
    grade: total >= 80 ? '최상' : total >= 60 ? '상' : total >= 40 ? '중' : '하',
    breakdown,
  }
}

export function gradeColor(total) {
  if (total >= 80) return '#22c55e'   // green
  if (total >= 60) return '#eab308'   // yellow
  if (total >= 40) return '#f97316'   // orange
  return '#ef4444'                     // red
}
