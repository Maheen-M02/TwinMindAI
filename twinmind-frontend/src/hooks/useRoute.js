import { useState, useEffect } from 'react'

export function useRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/')

  useEffect(() => {
    const handler = () => setRoute(window.location.hash.slice(1) || '/')
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  const navigate = (path) => {
    window.location.hash = path
  }

  return { route, navigate }
}
