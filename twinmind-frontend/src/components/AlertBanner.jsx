import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'

const SC = { WARNING: '#ff9500', CRITICAL: '#ff3b30' }

export default function AlertBanner({ data }) {
  const [visible, setVisible] = useState(false)
  const [alerts, setAlerts]   = useState([])

  useEffect(() => {
    if (!data) return
    const active = Object.values(data).filter(m => m.status === 'WARNING' || m.status === 'CRITICAL')
    setAlerts(active)
    if (active.length > 0) {
      setVisible(true)
      const t = setTimeout(() => setVisible(false), 10000)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
    }
  }, [data ? Object.values(data).map(m => m.machine_id + m.status).join(',') : ''])

  const worst = alerts.some(a => a.status === 'CRITICAL') ? 'CRITICAL' : 'WARNING'
  const bc    = SC[worst] || '#ffb800'

  return (
    <AnimatePresence>
      {visible && alerts.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{
            background: `linear-gradient(90deg, ${bc}15, ${bc}08, transparent)`,
            borderBottom: `3px solid ${bc}`,
            padding: '14px 32px',
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: bc + '15',
              border: `3px solid ${bc}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0 }}>
              <AlertTriangle size={20} color={bc} strokeWidth={3} />
            </div>
            <div style={{ flex: 1, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              {alerts.map(m => {
                const c = SC[m.status]
                return (
                  <div key={m.machine_id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 900, padding: '6px 12px', borderRadius: 8,
                      background: c + '15', color: c, letterSpacing: '0.1em',
                      border: `3px solid ${c}` }}>{m.machine_id}</span>
                    <span style={{ fontSize: 15, color: '#000000', fontWeight: 800 }}>
                      {m.status} · {((m.failure_prob || 0) * 100).toFixed(1)}% fail prob
                    </span>
                    {m.top_drivers?.[0] && (
                      <span style={{ fontSize: 14, color: '#333333', fontWeight: 700 }}>
                        · {m.top_drivers[0].label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <button onClick={() => setVisible(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#666666',
              padding: 6, borderRadius: 8, transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#000000'}
            onMouseLeave={e => e.currentTarget.style.color = '#666666'}
            >
              <X size={20} strokeWidth={3} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
