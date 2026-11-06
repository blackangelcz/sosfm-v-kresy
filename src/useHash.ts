import { useCallback, useEffect, useState } from 'react'

export function useHash() {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const update = () => setHash(window.location.hash)
    window.addEventListener('hashchange', update)
    window.addEventListener('popstate', update)
    return () => {
      window.removeEventListener('hashchange', update)
      window.removeEventListener('popstate', update)
    }
  }, [])

  const clear = useCallback(() => {
    window.history.pushState('', '', window.location.pathname + window.location.search)
    setHash('')
  }, [])

  return { hash, clear }
}
