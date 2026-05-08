import { useState, useEffect } from 'react'

const LS_KEY = 'goldtracker_wishlist'

export function useWishlist() {
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) ?? [] } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(wishlist))
  }, [wishlist])

  const toggle = (spotId) =>
    setWishlist(prev =>
      prev.includes(spotId) ? prev.filter(id => id !== spotId) : [...prev, spotId]
    )

  const has = (spotId) => wishlist.includes(spotId)

  return { wishlist, toggle, has }
}
