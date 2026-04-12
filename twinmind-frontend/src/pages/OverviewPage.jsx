import React from 'react'
import { Activity, Cpu, AlertTriangle, TrendingUp, Zap, Shield } from 'lucide-react'
import FactoryMap from '../components/FactoryMap'
import FactoryFloor from '../components/FactoryFloor'
import AlertBanner from '../components/AlertBanner'
import ProactiveAgent from '../components/ProactiveAgent'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function KpiCard({ icon: Icon, label, value, sub, color = '#00d4aa', onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'linear-gradient(145deg, #0d1120 0%, #0a0d18 100%)',
      borderRadius: 16, padding: '20px 22px',
      border: `1px solid ${color}18`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
      boxShadow: `0 0 30px ${color}0c, 0 4px 20px #00000060, inset 0 1px 0 #ffffff08`,
      position: 'relative', overflow: 'hidden',
    }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 0 40px ${color}18, 0 8px 30px #00000070, inset 0 1px 0 #ffffff08` } }}
    onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 0 30px ${color}0c, 0 4px 20px #00000060, inset 0 1px 0 #ffffff08` } }}
    >
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
      {/* Corner glow */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80,
        background: `radial-gradient(circle, ${color}14, transparent 70%)` }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${color}20, ${color}0c)`,
          border: `1px solid ${color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 16px ${color}20` }}>
          <Icon size={16} color={color} />
        </div>
        {onClick && (
          <div style={{ fontSize: 8, color: color + '66', letterSpacing: '0.1em' }}>VIEW →</div>
        )}
      </div>
      <div style={{ fontSize: 9, color: '#2a3050', fontWeight: 800,
        letterSpacing: '0.1em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color,
        lineHeight: 1, letterSpacing: '-0.02em',
        textShadow: `0 0 30px ${color}44` }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#2a3050', marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

export default function OverviewPage({ data, navigate }) {
  const machines = data ? Object.values(data) : []
  const healthy  = machines.filter(m => m.status === 'HEALTHY').length
  const warning  = machines.filter(m => m.status === 'WARNING').length
  const critical = machines.filter(m => m.status === 'CRITICAL').length
  const avgHealth = machines.length
    ? (machines.reduce((s, m) => s + (m.health_score || 0), 0) / machines.length).toFixed(1)
    : '—'
  const avgFp = machines.length
    ? (machines.reduce((s, m) => s + (m.failure_prob || 0), 0) / machines.length * 100).toFixed(1)
    : '—'

  const triggerFailure = async (mid) => {
    await fetch(`${API_URL}/demo/trigger-failure`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machine_id: mid, duration_cycles: 60 }),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <AlertBanner data={data} />

      {/* Header */}
      <div style={{ padding: '22px 24px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e8e8e8',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(90deg, #e8e8e8, #8888aa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Factory Overview
          </h1>
          <p style={{ fontSize: 11, color: '#3a4060', marginTop: 3 }}>
            Real-time health across all machines
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: '#2a3050', letterSpacing: '0.08em' }}>DEMO:</span>
          {['M1', 'M2', 'M3'].map(mid => (
            <button key={mid} onClick={() => triggerFailure(mid)} style={{
              background: 'linear-gradient(135deg, #ff303018, #ff303008)',
              border: '1px solid #ff303030', borderRadius: 8,
              padding: '6px 12px', cursor: 'pointer',
              color: '#ff3030', fontSize: 10, fontWeight: 800,
              letterSpacing: '0.06em', transition: 'all 0.15s',
              boxShadow: '0 0 12px #ff303010',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 20px #ff303030'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 12px #ff303010'}
            >⚡ {mid}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard icon={Activity}      label="AVG HEALTH"      value={`${avgHealth}%`} color="#00d4aa" />
          <KpiCard icon={TrendingUp}    label="AVG FAIL PROB"   value={`${avgFp}%`}
            color={parseFloat(avgFp) > 40 ? '#ff3030' : '#ffb800'} />
          <KpiCard icon={AlertTriangle} label="ACTIVE ALERTS"   value={warning + critical}
            sub={`${critical} critical · ${warning} warning`}
            color={critical > 0 ? '#ff3030' : warning > 0 ? '#ffb800' : '#00d4aa'}
            onClick={() => navigate('/analytics')} />
          <KpiCard icon={Cpu}           label="MACHINES ONLINE" value={`${healthy}/${machines.length}`}
            sub="healthy machines" color="#00d4aa"
            onClick={() => navigate('/twin')} />
        </div>

        <FactoryMap data={data} selectedMachine={null} onSelect={(id) => navigate(`/twin/${id}`)} />
        <FactoryFloor data={data} selectedMachine={null} onSelect={(id) => navigate(`/twin/${id}`)} />
        <ProactiveAgent wsData={data} />
      </div>
    </div>
  )
}
