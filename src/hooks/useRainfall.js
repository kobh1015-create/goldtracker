// 각 스팟에서 가장 가까운 ASOS 관측소 (사전 계산)
const SPOT_STATION = {
  hot1: 255, hot2: 245, hot3: 245, hot4: 251, hot5: 247,
  hot6: 247, hot7: 238, hot8: 245, hot9: 236, hot10: 221,
  hot11: 203, hot12: 217, hot13: 203, hot14: 226, hot15: 300,
  hot16: 143, hot17: 135, hot18: 290, hot19: 304, hot20: 136,
  hot21: 146, hot22: 268, hot23: 271, hot24: 263, hot25: 119,
  hot26: 216, hot27: 273, hot28: 216, hot29: 216, hot30: 217,
  hot31: 247,
}

const KMA_KEY = import.meta.env.VITE_KMA_KEY
const LS_KEY  = 'goldtracker_rainfall'

function dateStr(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function parseRainfall(text) {
  return text.split('\n')
    .filter(l => !l.startsWith('#') && l.trim() && !/777/.test(l))
    .map(line => {
      const cols = line.split(',')
      const rn = parseFloat(cols[38])
      return { date: cols[0]?.trim(), rn: rn >= 0 ? rn : 0 }
    })
    .filter(r => r.date?.length === 8)
}

async function fetchStation(stn) {
  const url = `https://apihub.kma.go.kr/api/typ01/url/kma_sfcdd.php?tm1=${dateStr(-7)}&tm2=${dateStr()}&stn=${stn}&authKey=${KMA_KEY}`
  const res  = await fetch(url)
  const text = await res.text()
  const days  = parseRainfall(text)
  return { stn, days, total: Math.round(days.reduce((s, d) => s + d.rn, 0) * 10) / 10 }
}

import { useState, useEffect } from 'react'

export function useRainfall() {
  const [rainfall, setRainfall] = useState({})

  useEffect(() => {
    const today = dateStr()
    try {
      const cached = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}')
      if (cached.date === today && cached.data) { setRainfall(cached.data); return }
    } catch {}

    const uniqueStns = [...new Set(Object.values(SPOT_STATION))]

    Promise.all(uniqueStns.map(fetchStation))
      .then(results => {
        const byStation = Object.fromEntries(results.map(r => [r.stn, r]))
        const data = Object.fromEntries(
          Object.entries(SPOT_STATION).map(([spotId, stn]) => [
            spotId,
            { total7d: byStation[stn]?.total ?? 0, days: byStation[stn]?.days ?? [] }
          ])
        )
        setRainfall(data)
        localStorage.setItem(LS_KEY, JSON.stringify({ date: today, data }))
      })
      .catch(() => {})
  }, [])

  return rainfall
}
