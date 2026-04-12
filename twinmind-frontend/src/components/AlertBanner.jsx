import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'

const SC = { WARNING: '#ffb800', CRITICAL: '#ff3030' }

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
            background: `linear-gradient(90deg, ${bc}12, ${bc}06, transparent)`,
            borderBottom: `1px solid ${bc}30`,
            padding: '9px 24px',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: `0 4px 20px ${bc}10`,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: bc + '18',
              border: `1px solid ${bc}30`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 12px ${bc}30`, flexShrink: 0 }}>
              <AlertTriangle size={13} color={bc} />
            </div>
            <div style={{ flex: 1, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              {alerts.map(m => {
                const c = SC[m.status]
                return (
                  <div key={m.machine_id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                      background: c + '20', color: c, letterSpacing: '0.08em',
                      border: `1px solid ${c}30` }}>{m.machine_id}</span>
                    <span style={{ fontSize: 11, color: '#8a8aa0' }}>
                      {m.status} · {((m.failure_prob || 0) * 100).toFixed(1)}% fail prob
                    </span>
                    {m.top_drivers?.[0] && (
                      <span style={{ fontSize: 10, color: '#3a4060' }}>
                        · {m.top_drivers[0].label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <button onClick={() => setVisible(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#3a4060',
              padding: 4, borderRadius: 6, transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#6a7090'}
            onMouseLeave={e => e.currentTarget.style.color = '#3a4060'}
            >
              <X size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
