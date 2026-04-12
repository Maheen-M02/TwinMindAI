import React, { useEffect, useRef } from 'react'

const SC = { HEALTHY: '#00d4aa', WARNING: '#ffb800', CRITICAL: '#ff3030' }

function MetricBar({ label, value, max, color, unit = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
        <span style={{ color: '#3a4060' }}>{label}</span>
        <span style={{ color: '#6a7090', fontWeight: 600 }}>{typeof value === 'number' ? value.toFixed(1) : '—'}{unit}</span>
      </div>
      <div style={{ background: '#060810', borderRadius: 3, height: 4,
        overflow: 'hidden', boxShadow: 'inset 0 1px 3px #00000080' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}66, ${color})`,
          borderRadius: 3, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 6px ${color}66`,
        }} />
      </div>
    </div>
  )
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, #0a0d18, #060810)',
      borderRadius: 10, padding: '12px 14px', flex: 1, textAlign: 'center',
      border: '1px solid #ffffff08',
      boxShadow: `0 0 20px ${color}10, inset 0 1px 0 #ffffff06`,
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color,
        textShadow: `0 0 20px ${color}66`, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 8, color: '#2a3050', marginTop: 4, letterSpacing: '0.08em' }}>{label}</div>
      {sub && <div style={{ fontSize: 8, color: '#1a2030', marginTop: 1 }}>{sub}</div>}
    </div>
  )
}

export default function MachineTwin({ machine }) {
  const gearRef  = useRef(null)
  const angleRef = useRef(0)
  const rafRef   = useRef(null)

  const status   = machine?.status || 'HEALTHY'
  const color    = SC[status]
  const rpm      = machine?.s9  || 9000
  const temp     = machine?.s4  || 1400
  const vib      = machine?.s11 || 47
  const fp       = machine?.failure_prob || 0
  const tempNorm = Math.min(1, Math.max(0, (temp - 1395) / 55))
  const vibNorm  = Math.min(1, Math.max(0, (vib - 44) / 8))
  const bearGlow = Math.min(1, (vib - 44) / 6)
  const isAnom   = machine?.is_anomaly || false
  const isCrit   = status === 'CRITICAL'

  useEffect(() => {
    const speed = (rpm / 9055) * 2.4
    const animate = () => {
      angleRef.current = (angleRef.current + speed) % 360
      if (gearRef.current) {
        gearRef.current.setAttribute('transform', `rotate(${angleRef.current.toFixed(2)}, 200, 115)`)
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [rpm])

  const topDrivers = machine?.top_drivers || []

  return (
    <div className="card" style={{
      padding: 20,
      border: `1px solid ${color}20`,
      boxShadow: `0 0 40px ${color}10, 0 4px 24px #00000060, inset 0 1px 0 #ffffff08`,
      animation: isCrit ? 'shake 0.35s infinite' : 'none',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', background: color,
            boxShadow: `0 0 12px ${color}, 0 0 24px ${color}66`,
            animation: isCrit ? 'blink 0.6s infinite' : 'none',
          }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#c8c8d8' }}>
            {machine?.machine_id || '—'} Digital Twin
          </span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {isAnom && (
            <span style={{ fontSize: 8, fontWeight: 800, padding: '3px 7px', borderRadius: 4,
              background: '#ff303018', color: '#ff3030', letterSpacing: '0.08em',
              border: '1px solid #ff303030', boxShadow: '0 0 12px #ff303020' }}>ANOMALY</span>
          )}
          <span style={{ fontSize: 8, fontWeight: 800, padding: '3px 7px', borderRadius: 4,
            background: color + '18', color, letterSpacing: '0.08em',
            border: `1px solid ${color}30`, boxShadow: `0 0 12px ${color}20` }}>{status}</span>
        </div>
      </div>

      {/* SVG */}
      <svg width="100%" viewBox="0 0 400 210" style={{ display: 'block', marginBottom: 16 }}>
        <defs>
          <radialGradient id="heatGrad" cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor="#ff4400" stopOpacity={tempNorm * 0.6} />
            <stop offset="100%" stopColor="#ff4400" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bodyGrad" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#141828" />
            <stop offset="100%" stopColor="#0a0d18" />
          </radialGradient>
          <filter id="glow-filter">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="soft-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Body */}
        <rect x="55" y="55" width="290" height="120" rx="12" fill="url(#bodyGrad)"
          stroke={color + '30'} strokeWidth="1.5" />

        {/* Inner body highlight */}
        <rect x="56" y="56" width="288" height="30" rx="11"
          fill="url(#heatGrad)" opacity="0.6" />

        {/* Heat overlay */}
        {tempNorm > 0.05 && (
          <rect x="55" y="55" width="290" height="120" rx="12" fill="url(#heatGrad)" />
        )}

        {/* Shaft */}
        <rect x="75" y="112" width="250" height="6" rx="3"
          fill="#1a1d2e" stroke="#2a2d3e" strokeWidth="0.5" />

        {/* Left bearing */}
        <circle cx="108" cy="115" r="30" fill="#0d1020" stroke="#1e2235" strokeWidth="1.5" />
        <circle cx="108" cy="115" r="22" fill="#080b14"
          stroke={bearGlow > 0.1 ? `rgba(255,180,0,${0.25 + bearGlow * 0.75})` : '#1a1d2e'}
          strokeWidth={1.5 + bearGlow * 5}
          filter={bearGlow > 0.3 ? 'url(#soft-glow)' : undefined} />
        <circle cx="108" cy="115" r="7" fill="#0d1020" stroke="#2a2d3e" strokeWidth="1" />

        {/* Right bearing */}
        <circle cx="292" cy="115" r="30" fill="#0d1020" stroke="#1e2235" strokeWidth="1.5" />
        <circle cx="292" cy="115" r="22" fill="#080b14"
          stroke={bearGlow > 0.1 ? `rgba(255,180,0,${0.25 + bearGlow * 0.75})` : '#1a1d2e'}
          strokeWidth={1.5 + bearGlow * 5}
          filter={bearGlow > 0.3 ? 'url(#soft-glow)' : undefined} />
        <circle cx="292" cy="115" r="7" fill="#0d1020" stroke="#2a2d3e" strokeWidth="1" />

        {/* Gear */}
        <g ref={gearRef} filter={isCrit ? 'url(#glow-filter)' : 'url(#soft-glow)'}>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * 30 * Math.PI) / 180
            return (
              <line key={i}
                x1={200 + 22 * Math.cos(a)} y1={115 + 22 * Math.sin(a)}
                x2={200 + 35 * Math.cos(a)} y2={115 + 35 * Math.sin(a)}
                stroke={color} strokeWidth="5.5" strokeLinecap="round" />
            )
          })}
          <circle cx="200" cy="115" r="20" fill="#0d1020" stroke={color} strokeWidth="1.5" />
          <circle cx="200" cy="115" r="10" fill={color} opacity="0.9" />
          <circle cx="200" cy="115" r="5" fill="#0d1020" />
        </g>

        {/* Anomaly rings */}
        {isAnom && (
          <>
            <circle cx="200" cy="115" r="44" fill="none" stroke="#ff3030" strokeWidth="1.5"
              style={{ animation: 'pulse-ring 1.2s ease-out infinite' }} />
            <circle cx="200" cy="115" r="44" fill="none" stroke="#ff3030" strokeWidth="1"
              style={{ animation: 'pulse-ring 1.2s ease-out infinite', animationDelay: '0.5s' }} />
          </>
        )}

        {/* Vibration bars */}
        {[-18, -6, 6, 18].map((offset, i) => {
          const h = 5 + vibNorm * 24
          return (
            <rect key={i} x={197 + offset} y={175 - h} width="5" height={h}
              fill={color} opacity={0.4 + vibNorm * 0.5} rx="2"
              filter="url(#soft-glow)" />
          )
        })}
        <text x="200" y="202" textAnchor="middle" fontSize="8" fill="#2a3050"
          fontFamily="Inter, system-ui, sans-serif">vibration</text>

        {/* Temp label */}
        {tempNorm > 0.1 && (
          <text x="200" y="72" textAnchor="middle" fontSize="9" fill="#ff6b35cc"
            fontFamily="Inter, system-ui, sans-serif">{temp.toFixed(0)}° HPC</text>
        )}
      </svg>

      {/* Metric bars */}
      <MetricBar label="HPC Outlet Temp" value={temp}  max={1480} color="#ff6b35" unit="°" />
      <MetricBar label="HPC Pressure"    value={vib}   max={52}   color="#ffb800" />
      <MetricBar label="Bleed Enthalpy"  value={rpm}   max={9200} color="#00d4aa" />
      <MetricBar label="Fuel Flow"       value={machine?.s12 || 521} max={530} color="#cc44ff" />

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <StatCard label="HEALTH"    value={`${machine?.health_score?.toFixed(0) ?? '—'}%`} color={color} />
        <StatCard label="FAIL PROB" value={`${(fp * 100).toFixed(1)}%`}
          color={fp > 0.7 ? '#ff3030' : fp > 0.4 ? '#ffb800' : '#00d4aa'} />
        <StatCard label="RUL" value={machine?.rul_cycles ?? '—'} color="#4a5070" sub="cycles" />
      </div>

      {/* Top drivers */}
      {topDrivers.length > 0 && (
        <div style={{ marginTop: 14, padding: '12px 14px',
          background: 'linear-gradient(145deg, #080b14, #060810)',
          borderRadius: 10, border: '1px solid #ffffff06',
          boxShadow: 'inset 0 1px 0 #ffffff04' }}>
          <div style={{ fontSize: 8, color: '#2a3050', fontWeight: 800,
            letterSpacing: '0.12em', marginBottom: 9 }}>TOP FAILURE DRIVERS</div>
          {topDrivers.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: i < topDrivers.length - 1 ? 7 : 0 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: color,
                boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#4a5070', flex: 1 }}>{d.label}</span>
              <div style={{ width: 60, background: '#0a0d18', borderRadius: 2, height: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, d.importance * 500)}%`, height: '100%',
                  background: `linear-gradient(90deg, ${color}66, ${color})`,
                  boxShadow: `0 0 4px ${color}` }} />
              </div>
              <span style={{ fontSize: 9, color: '#2a3050', width: 34, textAlign: 'right' }}>
                {(d.importance * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
