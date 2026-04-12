import React, { useEffect, useState } from 'react'
import { Activity, RefreshCw } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const STATUS_COLOR = { CRITICAL: '#ff3030', WARNING: '#ffb800', HEALTHY: '#00d4aa' }

function timeAgo(ts) {
  const diff = Math.floor(Date.now() - ts * 1000)
  if (diff < 60000)   return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

export default function EventLog() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  const fetch_ = async () => {
    try {
      const res = await fetch(`${API_URL}/events?limit=50`)
      const json = await res.json()
      setEvents(json.events || [])
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetch_()
    const t = setInterval(fetch_, 5000)
    return () => clearInterval(t)
  }, [])

  const filtered = filter === 'ALL' ? events : events.filter(e => e.status === filter)

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
        {['ALL', 'CRITICAL', 'WARNING'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? (STATUS_COLOR[f] || '#00d4aa') + '20' : 'transparent',
              border: `1px solid ${filter === f ? (STATUS_COLOR[f] || '#00d4aa') + '60' : '#1e2130'}`,
              borderRadius: 5, padding: '3px 9px', cursor: 'pointer',
              color: filter === f ? (STATUS_COLOR[f] || '#00d4aa') : '#555',
              fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
            }}
          >{f}</button>
        ))}
        <button
          onClick={fetch_}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#444' }}
        >
          <RefreshCw size={11} />
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#444', fontSize: 11 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#333' }}>
          <Activity size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
          <div style={{ fontSize: 11, color: '#444' }}>No events yet</div>
          <div style={{ fontSize: 10, color: '#333', marginTop: 2 }}>Events are logged when machines hit WARNING or CRITICAL</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 260, overflowY: 'auto' }}>
          {filtered.map((ev, i) => {
            const color = STATUS_COLOR[ev.status] || '#888'
            return (
              <div key={ev.id || i} style={{
                background: '#0f1117', borderRadius: 7, padding: '8px 10px',
                display: 'flex', alignItems: 'center', gap: 8,
                border: `1px solid ${color}18`,
                animation: 'fadeIn 0.2s ease',
              }}>
                <span style={{
                  fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 3,
                  background: color + '20', color, letterSpacing: '0.06em', flexShrink: 0,
                }}>{ev.machine_id}</span>

                <span style={{ fontSize: 10, color, fontWeight: 600, flexShrink: 0 }}>{ev.status}</span>

                <span style={{ fontSize: 10, color: '#555', flex: 1 }}>
                  {(ev.failure_prob * 100).toFixed(1)}% · {ev.rul_cycles} cyc RUL
                </span>

                {ev.top_driver && (
                  <span style={{ fontSize: 9, color: '#444', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.top_driver}
                  </span>
                )}

                <span style={{ fontSize: 9, color: '#333', flexShrink: 0 }}>{timeAgo(ev.ts)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
