import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SESSION_KEY = 'gt_access_code'
const LS_KEY = 'goldtracker_wishlist'

function getCode() {
  return localStorage.getItem(SESSION_KEY)
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) ?? [] } catch { return [] }
  })

  useEffect(() => {
    const code = getCode()
    if (!code) return
    supabase
      .from('wishlist')
      .select('spot_id')
      .eq('code', code)
      .then(({ data, error }) => {
        if (!error && data) {
          const ids = data.map(r => r.spot_id)
          setWishlist(ids)
          localStorage.setItem(LS_KEY, JSON.stringify(ids))
        }
      })
  }, [])

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(wishlist))
  }, [wishlist])

  const toggle = async (spotId) => {
    const code = getCode()
    const isIn = wishlist.includes(spotId)

    setWishlist(prev =>
      isIn ? prev.filter(id => id !== spotId) : [...prev, spotId]
    )

    if (!code) return
    if (isIn) {
      await supabase.from('wishlist').delete().eq('code', code).eq('spot_id', spotId)
    } else {
      await supabase.from('wishlist').insert({ code, spot_id: spotId })
    }
  }

  const has = (spotId) => wishlist.includes(spotId)

  return { wishlist, toggle, has }
}
