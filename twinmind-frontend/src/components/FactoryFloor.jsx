import React from 'react'
import { Thermometer, Activity, Heart, Zap } from 'lucide-react'

const SC = { HEALTHY: '#00d4aa', WARNING: '#ffb800', CRITICAL: '#ff3030' }

function MachineTile({ machine, selected, onClick }) {
  const color  = SC[machine.status] || '#555'
  const fp     = (machine.failure_prob || 0) * 100
  const isCrit = machine.status === 'CRITICAL'

  return (
    <div onClick={onClick} style={{
      flex: '1 1 200px', minWidth: 200, maxWidth: 280,
      background: selected
        ? `linear-gradient(145deg, ${color}14, ${color}06)`
        : 'linear-gradient(145deg, #0d1120, #0a0d18)',
      border: `1px solid ${selected ? color + '50' : '#ffffff08'}`,
      borderRadius: 16, padding: '18px 20px', cursor: 'pointer',
      transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
      boxShadow: selected
        ? `0 0 0 1px ${color}20, 0 8px 32px ${color}18, 0 2px 8px #00000060`
        : '0 2px 12px #00000050, 0 1px 0 #ffffff06 inset',
      transform: selected ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
      position: 'relative', overflow: 'hidden',
      animation: isCrit && selected ? 'shake 0.4s infinite' : 'none',
    }}
    onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = color + '30'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
    onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = '#ffffff08'; e.currentTarget.style.transform = 'translateY(0)' } }}
    >
      {/* Top glow strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}${selected ? 'cc' : '44'}, transparent)`,
        transition: 'opacity 0.3s',
      }} />

      {/* Corner accent */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 60, height: 60,
        background: `radial-gradient(circle at top right, ${color}10, transparent 70%)`,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 9, color: '#2a3050', fontWeight: 800, letterSpacing: '0.12em', marginBottom: 3 }}>
            MACHINE
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#e8e8e8', lineHeight: 1 }}>
            {machine.machine_id}
          </div>
        </div>
        <span style={{
          fontSize: 8, fontWeight: 800, padding: '3px 8px', borderRadius: 5,
          background: color + '18', color, letterSpacing: '0.08em',
          border: `1px solid ${color}30`,
          animation: isCrit ? 'blink 0.8s infinite' : 'none',
          boxShadow: `0 0 12px ${color}20`,
        }}>{machine.status}</span>
      </div>

      {/* Health number */}
      <div style={{ marginBottom: 10 }}>
        <div style={{
          fontSize: 40, fontWeight: 800, color, lineHeight: 1,
          letterSpacing: '-0.02em',
          textShadow: `0 0 30px ${color}44`,
        }}>
          {machine.health_score?.toFixed(0)}
          <span style={{ fontSize: 18, fontWeight: 600, color: color + 'aa' }}>%</span>
        </div>
        <div style={{ fontSize: 9, color: '#2a3050', marginTop: 2 }}>health score</div>
      </div>

      {/* Health bar */}
      <div style={{ background: '#0a0d18', borderRadius: 4, height: 4, marginBottom: 14,
        overflow: 'hidden', boxShadow: 'inset 0 1px 3px #00000060' }}>
        <div style={{
          width: `${machine.health_score || 0}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}66, ${color})`,
          borderRadius: 4, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 8px ${color}88`,
        }} />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
        {[
          { label: 'FAIL PROB', value: `${fp.toFixed(1)}%`, color: fp > 70 ? '#ff3030' : fp > 40 ? '#ffb800' : '#00d4aa' },
          { label: 'RUL', value: `${machine.rul_cycles ?? '—'}`, color: '#4a5070' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#060810', borderRadius: 8, padding: '6px 10px',
            border: '1px solid #ffffff06',
            boxShadow: 'inset 0 1px 0 #ffffff04',
          }}>
            <div style={{ fontSize: 8, color: '#2a3050', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Sensor row */}
      <div style={{ display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 10, color: '#3a4060', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Thermometer size={9} color="#ff6b35" /> {machine.s4?.toFixed(0)}°
        </span>
        <span style={{ fontSize: 10, color: '#3a4060', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Activity size={9} color="#ffb800" /> {machine.s11?.toFixed(1)}
        </span>
        {machine.is_anomaly && (
          <span style={{ marginLeft: 'auto', fontSize: 8, color: '#ff3030', fontWeight: 800,
            background: '#ff303018', padding: '1px 6px', borderRadius: 3, border: '1px solid #ff303030' }}>
            ANOMALY
          </span>
        )}
      </div>
    </div>
  )
}

export default function FactoryFloor({ data, selectedMachine, onSelect }) {
  if (!data) return (
    <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffb800', animation: 'blink 1s infinite' }} />
      <span style={{ fontSize: 12, color: '#3a4060' }}>Connecting to factory…</span>
    </div>
  )

  const machines = Object.values(data)
  const avgHealth = machines.reduce((s, m) => s + (m.health_score || 0), 0) / machines.length
  const hc = avgHealth > 65 ? '#00d4aa' : avgHealth > 35 ? '#ffb800' : '#ff3030'

  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#00d4aa14',
            border: '1px solid #00d4aa25', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={13} color="#00d4aa" />
          </div>
          <span className="label">Factory Floor</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, color: '#3a4060' }}>avg health</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: hc, textShadow: `0 0 20px ${hc}44` }}>
            {avgHealth.toFixed(1)}%
          </span>
          <div style={{ width: 80, background: '#060810', borderRadius: 3, height: 4,
            overflow: 'hidden', boxShadow: 'inset 0 1px 3px #00000060' }}>
            <div style={{ width: `${avgHealth}%`, height: '100%', background: hc,
              borderRadius: 3, transition: 'width 0.8s', boxShadow: `0 0 6px ${hc}` }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {machines.map(m => (
          <MachineTile key={m.machine_id} machine={m}
            selected={selectedMachine === m.machine_id}
            onClick={() => onSelect(m.machine_id)} />
        ))}
      </div>
    </div>
  )
}
