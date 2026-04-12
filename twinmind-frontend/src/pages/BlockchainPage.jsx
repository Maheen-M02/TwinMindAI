import React, { useEffect, useState } from 'react'
import { Link, Copy, ExternalLink, ShieldCheck, RefreshCw, CheckCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const STATUS_COLOR = { WARNING: '#ffb800', CRITICAL: '#ff3030', HEALTHY: '#00d4aa' }

function timeAgo(ts) {
  const diff = Math.floor(Date.now() / 1000 - ts)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function EventRow({ ev, onResolve, resolving }) {
  const [copied, setCopied] = useState(false)
  const hash  = ev.tx_hash || ev.data_hash || ''
  const color = STATUS_COLOR[ev.severity] || '#888'
  const fp    = ev.failure_prob_bps != null ? (ev.failure_prob_bps / 100).toFixed(1) : '—'

  const copy = () => {
    navigator.clipboard.writeText(hash).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      background: '#0f1117', borderRadius: 10, padding: '14px 16px',
      border: `1px solid ${color}20`,
      display: 'grid', gridTemplateColumns: '80px 90px 80px 80px 1fr 120px 80px',
      alignItems: 'center', gap: 12,
      opacity: ev.resolved ? 0.5 : 1,
    }}>
      <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
        background: color + '20', color, letterSpacing: '0.06em', textAlign: 'center' }}>
        {ev.machine_id}
      </span>

      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{ev.severity}</span>

      <span style={{ fontSize: 11, color: '#888' }}>{fp}%</span>

      <span style={{ fontSize: 11, color: '#888' }}>{ev.predicted_rul ?? '—'} cyc</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
        <span style={{ fontSize: 10, color: '#444', fontFamily: 'monospace',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {hash || 'N/A'}
        </span>
        {hash && (
          <>
            <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: copied ? '#00d4aa' : '#444', flexShrink: 0, padding: 2 }}>
              <Copy size={11} />
            </button>
            <a href={`https://mumbai.polygonscan.com/search?q=${hash}`}
              target="_blank" rel="noreferrer"
              style={{ color: '#444', flexShrink: 0 }}>
              <ExternalLink size={11} />
            </a>
          </>
        )}
      </div>

      <span style={{ fontSize: 10, color: '#444' }}>{timeAgo(ev.timestamp)}</span>

      {ev.resolved ? (
        <span style={{ fontSize: 10, color: '#00d4aa', display: 'flex', alignItems: 'center', gap: 4 }}>
          <CheckCircle size={11} /> Resolved
        </span>
      ) : (
        <button onClick={() => onResolve(ev.event_id)} disabled={resolving === ev.event_id} style={{
          background: '#00d4aa18', border: '1px solid #00d4aa35', borderRadius: 6,
          color: '#00d4aa', fontSize: 10, fontWeight: 700, padding: '4px 10px',
          cursor: 'pointer', opacity: resolving === ev.event_id ? 0.5 : 1,
        }}>
          {resolving === ev.event_id ? '…' : 'Resolve'}
        </button>
      )}
    </div>
  )
}

export default function BlockchainPage({ data }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(null)
  const [filter, setFilter] = useState('ALL')

  const fetch_ = async () => {
    try {
      const res = await fetch(`${API_URL}/blockchain/events`)
      const json = await res.json()
      setEvents(json.events || [])
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetch_()
    const t = setInterval(fetch_, 10000)
    return () => clearInterval(t)
  }, [])

  const resolve = async (eventId) => {
    setResolving(eventId)
    try {
      await fetch(`${API_URL}/blockchain/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      })
      await fetch_()
    } catch (_) {}
    finally { setResolving(null) }
  }

  const filtered = filter === 'ALL' ? events : events.filter(e => e.severity === filter)
  const total    = events.length
  const resolved = events.filter(e => e.resolved).length
  const critical = events.filter(e => e.severity === 'CRITICAL').length

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#e8e8e8' }}>Blockchain Ledger</h1>
          <p style={{ fontSize: 12, color: '#555', marginTop: 3 }}>
            Immutable audit trail · auto-logged on WARNING/CRITICAL · SHA-256 hashed sensor snapshots
          </p>
        </div>
        <button onClick={fetch_} style={{ background: '#13161e', border: '1px solid #1e2130',
          borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#555',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'TOTAL EVENTS',    value: total,    color: '#888' },
          { label: 'CRITICAL EVENTS', value: critical, color: '#ff3030' },
          { label: 'RESOLVED',        value: resolved, color: '#00d4aa' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter + table */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Link size={13} color="#00d4aa" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#e8e8e8' }}>On-Chain Events</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {['ALL', 'CRITICAL', 'WARNING'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                background: filter === f ? (STATUS_COLOR[f] || '#00d4aa') + '20' : 'transparent',
                border: `1px solid ${filter === f ? (STATUS_COLOR[f] || '#00d4aa') + '55' : '#1e2130'}`,
                borderRadius: 5, padding: '3px 10px', cursor: 'pointer',
                color: filter === f ? (STATUS_COLOR[f] || '#00d4aa') : '#555',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
              }}>{f}</button>
            ))}
          </div>
        </div>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px 90px 80px 80px 1fr 120px 80px',
          gap: 12, padding: '0 0 8px', borderBottom: '1px solid #1e2130', marginBottom: 10 }}>
          {['Machine', 'Severity', 'Fail %', 'RUL', 'Data Hash', 'Time', 'Action'].map(h => (
            <span key={h} style={{ fontSize: 9, color: '#444', fontWeight: 700, letterSpacing: '0.06em' }}>{h.toUpperCase()}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#444', fontSize: 12 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <ShieldCheck size={32} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.2 }} />
            <div style={{ fontSize: 12, color: '#444' }}>No on-chain events yet</div>
            <div style={{ fontSize: 11, color: '#333', marginTop: 4 }}>
              Trigger a failure demo to generate blockchain events
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map((ev, i) => (
              <EventRow key={ev.event_id ?? i} ev={ev} onResolve={resolve} resolving={resolving} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
