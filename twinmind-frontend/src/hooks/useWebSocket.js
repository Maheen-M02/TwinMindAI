import { useEffect, useRef, useState, useCallback } from 'react'

const MAX_RETRIES = 10
const RETRY_DELAY = 500

export function useWebSocket(url) {
  const [data, setData]               = useState(null)
  const [status, setStatus]           = useState('connecting')
  const [lastUpdate, setLastUpdate]   = useState(null)
  const [recommendations, setRecs]    = useState([])
  const wsRef    = useRef(null)
  const retriesRef = useRef(0)
  const timerRef   = useRef(null)

  const connect = useCallback(() => {
    if (!url) return
    setStatus(retriesRef.current > 0 ? 'reconnecting' : 'connecting')

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      retriesRef.current = 0
      setStatus('connected')
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'factory_update') {
          setData(msg.machines)
          setLastUpdate(new Date())
        } else if (msg.type === 'proactive_recommendations') {
          setRecs(msg.recommendations || [])
          // Also push to ProactiveAgent component if mounted
          if (typeof window.__twinmind_push_recs === 'function') {
            window.__twinmind_push_recs(msg.recommendations)
          }
        }
      } catch (_) {}
    }

    ws.onclose = () => {
      if (retriesRef.current < MAX_RETRIES) {
        retriesRef.current++
        setStatus('reconnecting')
        timerRef.current = setTimeout(connect, RETRY_DELAY)
      } else {
        setStatus('error')
      }
    }

    ws.onerror = () => { ws.close() }
  }, [url])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(timerRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { data, status, lastUpdate, recommendations }
}
