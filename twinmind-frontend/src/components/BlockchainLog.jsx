import React, { useEffect, useState } from 'react'
import { Copy, ExternalLink, ShieldCheck, Link } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const SC = { WARNING: '#ffb800', CRITICAL: '#ff3030', HEALTHY: '#00d4aa' }

function timeAgo(ts) {
  const d = Math.floor(Date.now() / 1000 - ts)
  if (d < 60)   return `${d}s ago`
  if (d < 3600) return `${Math.floor(d / 60)}m ago`
  return `${Math.floor(d / 3600)}h ago`
}

export default function BlockchainLog() {
  const [events, setEvents] = useState([])
  const [copied, setCopied] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch_ = async () => {
    try {
      const res = await fetch(`${API_URL}/blockchain/events`)
      const json = await res.json()
      setEvents(json.events || [])
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetch_(); const t = setInterval(fetch_, 10000); return () => clearInterval(t) }, [])

  const copy = (hash) => {
    navigator.clipboard.writeText(hash).catch(() => {})
    setCopied(hash); setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#00d4aa14',
            border: '1px solid #00d4aa25', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Link size={12} color="#00d4aa" />
          </div>
          <span className="label">Blockchain Ledger</span>
        </div>
        <span style={{ fontSize: 8, color: '#2a3050', letterSpacing: '0.08em' }}>
          {events.length > 0 && events[0].simulated ? 'SIMULATED LEDGER' : 'POLYGON MUMBAI'}
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#2a3050', fontSize: 11 }}>Loading…</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#00d4aa0c',
            border: '1px solid #00d4aa18', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px' }}>
            <ShieldCheck size={20} color="#00d4aa44" />
          </div>
          <div style={{ fontSize: 11, color: '#2a3050' }}>No events yet</div>
          <div style={{ fontSize: 10, color: '#1a2030', marginTop: 3 }}>
            Trigger a machine failure to generate ledger entries
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: 220 }}>
          {events.map((ev, i) => {
            const hash  = ev.tx_hash || ev.data_hash || ''
            const short = hash.length > 12 ? hash.slice(0, 10) + '…' + hash.slice(-6) : hash
            const color = SC[ev.severity] || '#555'
            const fp    = ev.failure_prob_bps != null ? (ev.failure_prob_bps / 100).toFixed(1) : '—'
            return (
              <div key={i} style={{
                background: 'linear-gradient(135deg, #0a0d18, #080b14)',
                borderRadius: 9, padding: '9px 12px',
                display: 'flex', alignItems: 'center', gap: 8,
                border: `1px solid ${color}18`,
                boxShadow: `0 0 16px ${color}08`,
                animation: 'fadeIn 0.3s ease',
              }}>
                <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                  background: color + '18', color, letterSpacing: '0.08em',
                  border: `1px solid ${color}25`, flexShrink: 0 }}>{ev.machine_id}</span>
                <span style={{ fontSize: 10, color, fontWeight: 700, flexShrink: 0 }}>{ev.severity}</span>
                <span style={{ fontSize: 9, color: '#3a4060', flexShrink: 0 }}>{fp}%</span>
                <span style={{ fontSize: 9, color: '#2a3050', fontFamily: 'monospace',
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {short}
                </span>
                {ev.resolved && (
                  <span style={{ fontSize: 8, color: '#00d4aa', flexShrink: 0 }}>✓</span>
                )}
                <button onClick={() => copy(hash)} style={{ background: 'none', border: 'none',
                  cursor: 'pointer', color: copied === hash ? '#00d4aa' : '#2a3050',
                  padding: 2, flexShrink: 0, transition: 'color 0.15s' }}>
                  <Copy size={10} />
                </button>
                <a href={ev.simulated
                    ? `https://mumbai.polygonscan.com/search?q=${hash}`
                    : `https://mumbai.polygonscan.com/tx/${hash}`}
                  target="_blank" rel="noreferrer"
                  style={{ color: '#2a3050', flexShrink: 0 }}>
                  <ExternalLink size={10} />
                </a>
                <span style={{ fontSize: 9, color: '#1a2030', flexShrink: 0 }}>{timeAgo(ev.timestamp)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
