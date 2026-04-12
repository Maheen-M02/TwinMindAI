import React, { useEffect, useRef, useState } from 'react'
import { TrendingDown, AlertTriangle, Clock, ShieldCheck } from 'lucide-react'
import { motion, useSpring, useTransform } from 'framer-motion'
import BlockchainLog from '../components/BlockchainLog'

const STATUS_COLOR = { HEALTHY: '#00d4aa', WARNING: '#ffb800', CRITICAL: '#ff3030' }
const HOURLY_RATE = 800

function AnimatedDollar({ value, color }) {
  const spring = useSpring(value, { stiffness: 60, damping: 18 })
  const display = useTransform(spring, v => `$${Math.floor(v).toLocaleString()}`)
  useEffect(() => { spring.set(value) }, [value])
  return <motion.span style={{ color }}>{display}</motion.span>
}

function KpiCard({ icon: Icon, label, value, sub, color, animated }) {
  return (
    <div className="card" style={{ padding: 24, border: `1px solid ${color}22` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={color} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#555' }}>{label}</span>
      </div>
      <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, marginBottom: 6 }}>
        {animated
          ? <AnimatedDollar value={typeof value === 'number' ? value : 0} color={color} />
          : <span style={{ color }}>{typeof value === 'number' ? `$${value.toLocaleString()}` : value}</span>
        }
      </div>
      {sub && <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function MachineRiskRow({ machine }) {
  const color  = STATUS_COLOR[machine.status] || '#888'
  const fp     = (machine.failure_prob * 100).toFixed(1)
  const risk   = machine.status === 'CRITICAL' ? HOURLY_RATE * 8
               : machine.status === 'WARNING'  ? HOURLY_RATE * 2 : 0
  const barPct = Math.min(100, machine.failure_prob * 100)

  return (
    <div style={{ padding: '14px 16px', background: '#0f1117', borderRadius: 10,
      border: `1px solid ${color}18` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4,
          background: color + '20', color, letterSpacing: '0.06em' }}>
          {machine.machine_id}
        </span>
        <span style={{ fontSize: 11, color, fontWeight: 600 }}>{machine.status}</span>
        <span style={{ fontSize: 11, color: '#555' }}>Fail prob: {fp}%</span>
        <span style={{ fontSize: 11, color: '#555' }}>RUL: {machine.rul_cycles} cyc</span>
        <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 800,
          color: risk > 0 ? '#ff3030' : '#00d4aa' }}>
          {risk > 0 ? `-$${risk.toLocaleString()}` : '✓ No risk'}
        </span>
      </div>
      <div style={{ background: '#1e2130', borderRadius: 3, height: 5, overflow: 'hidden' }}>
        <div style={{
          width: `${barPct}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}66, ${color})`,
          borderRadius: 3, transition: 'width 0.6s',
        }} />
      </div>
      {machine.top_drivers?.[0] && (
        <div style={{ fontSize: 10, color: '#444', marginTop: 5 }}>
          Top driver: {machine.top_drivers[0].label}
        </div>
      )}
    </div>
  )
}

export default function CostsPage({ data }) {
  const [saved, setSaved] = useState(0)
  const lastRef = useRef(Date.now())

  const machines   = data ? Object.values(data) : []
  const criticals  = machines.filter(m => m.status === 'CRITICAL')
  const warnings   = machines.filter(m => m.status === 'WARNING')
  const allHealthy = machines.length > 0 && machines.every(m => m.status === 'HEALTHY')
  const totalRisk  = criticals.length * HOURLY_RATE * 8 + warnings.length * HOURLY_RATE * 2

  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now()
      const elapsed = (now - lastRef.current) / 1000
      lastRef.current = now
      if (allHealthy) setSaved(prev => prev + (elapsed / 3600) * HOURLY_RATE)
    }, 1000)
    return () => clearInterval(t)
  }, [allHealthy])

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#e8e8e8' }}>Cost Impact</h1>
        <p style={{ fontSize: 12, color: '#555', marginTop: 3 }}>
          Real-time ROI tracking · downtime risk · financial exposure
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <KpiCard icon={TrendingDown} label="UPTIME ROI SAVED" animated
          value={saved} color="#00d4aa"
          sub={`@ $${HOURLY_RATE}/hr · ${allHealthy ? 'all machines healthy ✓' : 'paused — degradation active'}`}
        />
        <KpiCard icon={AlertTriangle} label="TOTAL FINANCIAL RISK"
          value={totalRisk} color={totalRisk > 0 ? '#ff3030' : '#00d4aa'}
          sub={`${criticals.length} critical (est. 8h) · ${warnings.length} warning (est. 2h)`}
        />
        <KpiCard icon={Clock} label="DOWNTIME RATE"
          value={`$${HOURLY_RATE.toLocaleString()}`} color="#888"
          sub="per hour · industry average for manufacturing"
        />
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e8e8', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} color="#ffb800" />
          Machine Risk Breakdown
        </div>
        {machines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#444', fontSize: 12 }}>
            Waiting for live data…
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {machines.map(m => <MachineRiskRow key={m.machine_id} machine={m} />)}
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e8e8', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={14} color="#00d4aa" />
          Immutable Audit Trail
        </div>
        <BlockchainLog />
      </div>
    </div>
  )
}
