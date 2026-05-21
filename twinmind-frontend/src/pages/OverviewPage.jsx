import React from 'react'
import { Activity, Cpu, AlertTriangle, TrendingUp, Zap, Shield } from 'lucide-react'
import FactoryMap from '../components/FactoryMap'
import FactoryFloor from '../components/FactoryFloor'
import AlertBanner from '../components/AlertBanner'
import ProactiveAgent from '../components/ProactiveAgent'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function KpiCard({ icon: Icon, label, value, sub, color = '#00a888', onClick }) {
  return (
    <div onClick={onClick} style={{
      background: '#ffffff',
      borderRadius: 16, padding: '28px 30px',
      border: `3px solid ${color}`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
      boxShadow: `0 4px 12px rgba(0,0,0,0.08)`,
      position: 'relative', overflow: 'hidden',
    }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 20px rgba(0,0,0,0.12)` } }}
    onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.08)` } }}
    >
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: color }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12,
          background: color + '15',
          border: `3px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={24} color={color} strokeWidth={3} />
        </div>
        {onClick && (
          <div style={{ fontSize: 12, color: color, letterSpacing: '0.1em', fontWeight: 800 }}>VIEW →</div>
        )}
      </div>
      <div style={{ fontSize: 12, color: '#333333', fontWeight: 900,
        letterSpacing: '0.14em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 44, fontWeight: 900, color,
        lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 14, color: '#666666', marginTop: 8, fontWeight: 700 }}>{sub}</div>}
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
      <div style={{ padding: '30px 32px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#000000',
            letterSpacing: '-0.02em' }}>
            Factory Overview
          </h1>
          <p style={{ fontSize: 16, color: '#333333', marginTop: 6, fontWeight: 700 }}>
            Real-time health across all machines
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#333333', letterSpacing: '0.1em', fontWeight: 900 }}>DEMO:</span>
          {['M1', 'M2', 'M3'].map(mid => (
            <button key={mid} onClick={() => triggerFailure(mid)} style={{
              background: '#ff3b3015',
              border: '3px solid #ff3b30', borderRadius: 10,
              padding: '10px 16px', cursor: 'pointer',
              color: '#ff3b30', fontSize: 14, fontWeight: 900,
              letterSpacing: '0.08em', transition: 'all 0.15s',
              boxShadow: '0 2px 8px rgba(255,59,48,0.15)',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,59,48,0.25)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,59,48,0.15)'}
            >⚡ {mid}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '18px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <KpiCard icon={Activity}      label="AVG HEALTH"      value={`${avgHealth}%`} color="#00a888" />
          <KpiCard icon={TrendingUp}    label="AVG FAIL PROB"   value={`${avgFp}%`}
            color={parseFloat(avgFp) > 40 ? '#ff3b30' : '#ff9500'} />
          <KpiCard icon={AlertTriangle} label="ACTIVE ALERTS"   value={warning + critical}
            sub={`${critical} critical · ${warning} warning`}
            color={critical > 0 ? '#ff3b30' : warning > 0 ? '#ff9500' : '#00a888'}
            onClick={() => navigate('/analytics')} />
          <KpiCard icon={Cpu}           label="MACHINES ONLINE" value={`${healthy}/${machines.length}`}
            sub="healthy machines" color="#00a888"
            onClick={() => navigate('/twin')} />
        </div>

        <FactoryMap data={data} selectedMachine={null} onSelect={(id) => navigate(`/twin/${id}`)} />
        <FactoryFloor data={data} selectedMachine={null} onSelect={(id) => navigate(`/twin/${id}`)} />
        <ProactiveAgent wsData={data} />
      </div>
    </div>
  )
}
