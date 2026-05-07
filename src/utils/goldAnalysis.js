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
  mineProximity: 40,  // 폐광산 근접도: 금맥 공급원 존재 가능성
  pointBar: 35,       // Point Bar 위치: 비중 퇴적 최적 구간
  confluence: 15,     // 합류부 근접도: 유속 급감으로 퇴적 촉진
  bonus: 10,          // 복수 요인 동시 충족 시 보너스
}

/**
 * 특정 좌표의 사금 유망도를 0~100으로 점수화
 * @param {number} lat
 * @param {number} lng
 * @param {{ mines, pointBars, confluences }} data
 * @returns {{ total: number, grade: string, breakdown: Array }}
 */
export function scoreLocation(lat, lng, { mines, pointBars, confluences }) {
  const breakdown = []
  let total = 0

  // 1. 폐광산 근접도 (max 40pt)
  // 3km 이내 만점, 15km 밖 0점 — 멀수록 금이 희석되므로 가중치 급감
  let mineScore = 0
  let nearest = { mine: null, dist: Infinity }
  for (const mine of mines) {
    const d = haversineKm(lat, lng, mine.lat, mine.lng)
    if (d < nearest.dist) nearest = { mine, dist: d }
  }
  if (nearest.mine && nearest.dist < 15) {
    if (nearest.dist < 3)       mineScore = 40
    else if (nearest.dist < 8)  mineScore = Math.round(40 - (nearest.dist - 3) / 5 * 25)
    else                        mineScore = Math.round(15 - (nearest.dist - 8) / 7 * 15)
    mineScore = Math.max(0, mineScore)
    breakdown.push({
      factor: '폐광산 근접',
      score: mineScore,
      max: 40,
      detail: `${nearest.mine.name} (${nearest.dist.toFixed(1)}km)`,
    })
    total += mineScore
  }

  // 2. Point Bar 근접도 (max 35pt)
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
    if (nearestPb.dist < 0.5) pbScore = 35
    else pbScore = Math.round(35 * (1 - (nearestPb.dist - 0.5) / 4.5))
    pbScore = Math.max(0, pbScore)
    breakdown.push({
      factor: 'Point Bar',
      score: pbScore,
      max: 35,
      detail: `${nearestPb.pb.name} (${(nearestPb.dist * 1000).toFixed(0)}m)`,
    })
    total += pbScore
  }

  // 3. 합류부 근접도 (max 15pt)
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

  // 4. 복수 요인 보너스 (max 10pt)
  // 세 요인 모두 충족 시 +10, 두 요인 충족 시 +5
  const activeFactors = breakdown.length
  if (activeFactors === 3) {
    breakdown.push({ factor: '복합 요인 보너스', score: 10, max: 10, detail: '3개 요인 동시 충족' })
    total += 10
  } else if (activeFactors === 2) {
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
