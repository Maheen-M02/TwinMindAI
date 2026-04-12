import React, { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { TrendingDown, AlertTriangle, Clock } from 'lucide-react'

const HOURLY_RATE = 800

function AnimatedDollar({ value, color }) {
  const spring  = useSpring(value, { stiffness: 60, damping: 18 })
  const display = useTransform(spring, v => `$${Math.floor(v).toLocaleString()}`)
  useEffect(() => { spring.set(value) }, [value])
  return <motion.span style={{ color }}>{display}</motion.span>
}

export default function CostImpactPanel({ data, hourlyRate = HOURLY_RATE }) {
  const [saved, setSaved] = useState(0)
  const lastRef = useRef(Date.now())

  const machines   = data ? Object.values(data) : []
  const criticals  = machines.filter(m => m.status === 'CRITICAL')
  const warnings   = machines.filter(m => m.status === 'WARNING')
  const allHealthy = machines.length > 0 && machines.every(m => m.status === 'HEALTHY')
  const critLoss   = criticals.length * hourlyRate * 8
  const warnLoss   = warnings.length  * hourlyRate * 2

  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now()
      const elapsed = (now - lastRef.current) / 1000
      lastRef.current = now
      if (allHealthy) setSaved(prev => prev + (elapsed / 3600) * hourlyRate)
    }, 1000)
    return () => clearInterval(t)
  }, [allHealthy, hourlyRate])

  return (
    <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#00d4aa14',
          border: '1px solid #00d4aa25', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingDown size={13} color="#00d4aa" />
        </div>
        <span className="label">Cost Impact</span>
      </div>

      {/* ROI saved */}
      <div style={{
        background: 'linear-gradient(145deg, #00d4aa0c, #00d4aa06)',
        border: '1px solid #00d4aa20', borderRadius: 12, padding: '14px 16px',
        boxShadow: '0 0 30px #00d4aa0c',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, #00d4aa40, transparent)' }} />
        <div style={{ fontSize: 8, color: '#00d4aa88', fontWeight: 800,
          letterSpacing: '0.12em', marginBottom: 6 }}>UPTIME ROI SAVED</div>
        <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>
          <AnimatedDollar value={saved} color="#00d4aa" />
        </div>
        <div style={{ fontSize: 9, color: '#2a4040' }}>
          @ ${hourlyRate}/hr · {allHealthy ? 'all machines healthy ✓' : 'paused — degradation active'}
        </div>
      </div>

      {/* Critical */}
      {criticals.length > 0 && (
        <div style={{
          background: 'linear-gradient(145deg, #ff30300c, #ff303006)',
          border: '1px solid #ff303025', borderRadius: 12, padding: '12px 16px',
          boxShadow: '0 0 24px #ff303010',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <AlertTriangle size={10} color="#ff3030" />
            <span style={{ fontSize: 8, color: '#ff303088', fontWeight: 800, letterSpacing: '0.1em' }}>
              CRITICAL — EST. 8H DOWNTIME
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#ff3030',
            textShadow: '0 0 20px #ff303044' }}>${critLoss.toLocaleString()}</div>
          <div style={{ fontSize: 9, color: '#3a2020', marginTop: 3 }}>
            {criticals.map(m => m.machine_id).join(', ')}
          </div>
        </div>
      )}

      {/* Warning */}
      {warnings.length > 0 && (
        <div style={{
          background: 'linear-gradient(145deg, #ffb8000c, #ffb80006)',
          border: '1px solid #ffb80020', borderRadius: 12, padding: '10px 14px',
        }}>
          <div style={{ fontSize: 8, color: '#ffb80088', fontWeight: 800,
            letterSpacing: '0.1em', marginBottom: 4 }}>WARNING — EST. 2H IMPACT</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#ffb800' }}>
            ${warnLoss.toLocaleString()}
          </div>
          <div style={{ fontSize: 9, color: '#3a3020', marginTop: 2 }}>
            {warnings.map(m => m.machine_id).join(', ')}
          </div>
        </div>
      )}

      <div style={{ fontSize: 8, color: '#1a2030', textAlign: 'center', marginTop: 'auto' }}>
        rate: ${hourlyRate}/hr · industry average
      </div>
    </div>
  )
}
