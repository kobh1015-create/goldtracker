import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useRainfall() {
  const [rainfall, setRainfall] = useState({})

  useEffect(() => {
    supabase
      .from('rainfall')
      .select('spot_id, total7d, last_rain_date')
      .then(({ data, error }) => {
        if (error || !data) return
        setRainfall(Object.fromEntries(
          data.map(r => [r.spot_id, {
            total7d:      r.total7d,
            lastRainDate: r.last_rain_date,
          }])
        ))
      })
  }, [])

  return rainfall
}
