import React, { useEffect, useRef } from 'react'

const SC = { HEALTHY: '#00a888', WARNING: '#ff9500', CRITICAL: '#ff3b30' }

function MetricBar({ label, value, max, color, unit = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6, fontWeight: 800 }}>
        <span style={{ color: '#333333' }}>{label}</span>
        <span style={{ color: '#000000', fontWeight: 900 }}>{typeof value === 'number' ? value.toFixed(1) : '—'}{unit}</span>
      </div>
      <div style={{ background: '#f5f5f5', borderRadius: 5, height: 8,
        overflow: 'hidden', border: '2px solid #e0e0e0' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          borderRadius: 4, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  )
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 12, padding: '20px 16px', flex: 1, textAlign: 'center',
      border: '3px solid #e0e0e0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: 34, fontWeight: 900, color,
        lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#333333', marginTop: 6, letterSpacing: '0.12em', fontWeight: 900 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#666666', marginTop: 3, fontWeight: 700 }}>{sub}</div>}
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
      padding: 26,
      border: `3px solid ${color}`,
      animation: isCrit ? 'shake 0.35s infinite' : 'none',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 16, height: 16, borderRadius: '50%', background: color,
            boxShadow: `0 0 12px ${color}80`,
            animation: isCrit ? 'blink 0.6s infinite' : 'none',
          }} />
          <span style={{ fontSize: 18, fontWeight: 900, color: '#000000' }}>
            {machine?.machine_id || '—'} Digital Twin
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAnom && (
            <span style={{ fontSize: 12, fontWeight: 900, padding: '6px 12px', borderRadius: 8,
              background: '#ff3b3015', color: '#ff3b30', letterSpacing: '0.1em',
              border: '3px solid #ff3b30' }}>ANOMALY</span>
          )}
          <span style={{ fontSize: 12, fontWeight: 900, padding: '6px 12px', borderRadius: 8,
            background: color + '15', color, letterSpacing: '0.1em',
            border: `3px solid ${color}` }}>{status}</span>
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
      <MetricBar label="HPC Pressure"    value={vib}   max={52}   color="#ff9500" />
      <MetricBar label="Bleed Enthalpy"  value={rpm}   max={9200} color="#00a888" />
      <MetricBar label="Fuel Flow"       value={machine?.s12 || 521} max={530} color="#af52de" />

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
        <StatCard label="HEALTH"    value={`${machine?.health_score?.toFixed(0) ?? '—'}%`} color={color} />
        <StatCard label="FAIL PROB" value={`${(fp * 100).toFixed(1)}%`}
          color={fp > 0.7 ? '#ff3b30' : fp > 0.4 ? '#ff9500' : '#00a888'} />
        <StatCard label="RUL" value={machine?.rul_cycles ?? '—'} color="#333333" sub="cycles" />
      </div>

      {/* Top drivers */}
      {topDrivers.length > 0 && (
        <div style={{ marginTop: 18, padding: '16px 18px',
          background: '#ffffff',
          borderRadius: 12, border: '3px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, color: '#333333', fontWeight: 900,
            letterSpacing: '0.16em', marginBottom: 13 }}>TOP FAILURE DRIVERS</div>
          {topDrivers.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: i < topDrivers.length - 1 ? 11 : 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color,
                flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: '#000000', flex: 1, fontWeight: 700 }}>{d.label}</span>
              <div style={{ width: 80, background: '#f5f5f5', borderRadius: 4, height: 6, overflow: 'hidden',
                border: '2px solid #e0e0e0' }}>
                <div style={{ width: `${Math.min(100, d.importance * 500)}%`, height: '100%',
                  background: `linear-gradient(90deg, ${color}cc, ${color})` }} />
              </div>
              <span style={{ fontSize: 13, color: '#333333', width: 48, textAlign: 'right', fontWeight: 800 }}>
                {(d.importance * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
