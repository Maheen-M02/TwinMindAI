import React, { useState } from 'react'
import { TrendingUp, TrendingDown, FlaskConical, RotateCcw, Zap } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SLIDERS = [
  { key: 's4',  label: 'HPC Temp',       min: -80,  max: 80,  step: 5,   unit: '°', color: '#ff6b35' },
  { key: 's11', label: 'HPC Pressure',   min: -3,   max: 3,   step: 0.1, unit: '',  color: '#ffb800' },
  { key: 's9',  label: 'Bleed Enthalpy', min: -500, max: 500, step: 50,  unit: '',  color: '#00d4aa' },
  { key: 's12', label: 'Fuel Flow',      min: -10,  max: 10,  step: 0.5, unit: '',  color: '#cc44ff' },
]

const DEFAULT = { s4: 0, s11: 0, s9: 0, s12: 0 }

export default function WhatIfPanel({ machine }) {
  const [deltas, setDeltas] = useState(DEFAULT)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const hasChanges = Object.values(deltas).some(v => v !== 0)

  const run = async () => {
    if (!machine) return
    setLoading(true)
    try {
      const overrides = {}
      SLIDERS.forEach(s => {
        if (deltas[s.key] !== 0) overrides[s.key] = (machine[s.key] || 0) + deltas[s.key]
      })
      const res = await fetch(`${API_URL}/whatif`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine_id: machine.machine_id, sensor_overrides: overrides, cycle: machine.cycle }),
      })
      setResult(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const reset = () => { setDeltas(DEFAULT); setResult(null) }

  const delta  = result?.delta_failure_prob ?? null
  const safer  = delta !== null && delta < 0
  const baseFp = result ? (result.baseline.failure_prob * 100).toFixed(1) : null
  const whatFp = result ? (result.whatif.failure_prob * 100).toFixed(1) : null

  return (
    <div>
      {SLIDERS.map(s => {
        const changed = deltas[s.key] !== 0
        return (
          <div key={s.key} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 6 }}>
              <span style={{ color: '#3a4060', fontWeight: 700, letterSpacing: '0.06em' }}>
                {s.label.toUpperCase()}
              </span>
              <span style={{
                color: changed ? s.color : '#2a3050', fontWeight: 800, fontSize: 11,
                textShadow: changed ? `0 0 12px ${s.color}66` : 'none',
                transition: 'all 0.2s',
              }}>
                {deltas[s.key] >= 0 ? '+' : ''}{deltas[s.key]}{s.unit}
              </span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step}
              value={deltas[s.key]}
              onChange={e => setDeltas(prev => ({ ...prev, [s.key]: parseFloat(e.target.value) }))}
              style={{ width: '100%', accentColor: s.color }}
            />
          </div>
        )
      })}

      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button onClick={run} disabled={loading || !machine || !hasChanges} style={{
          flex: 1,
          background: hasChanges
            ? 'linear-gradient(135deg, #00d4aa, #00a882)'
            : 'linear-gradient(135deg, #1a1d2e, #141728)',
          border: 'none', borderRadius: 10,
          color: hasChanges ? '#060810' : '#2a3050',
          fontWeight: 800, padding: '11px', cursor: hasChanges ? 'pointer' : 'not-allowed',
          fontSize: 11, letterSpacing: '0.08em',
          opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: hasChanges ? '0 0 20px #00d4aa30, 0 4px 12px #00000040' : 'none',
        }}>
          <FlaskConical size={12} />
          {loading ? 'RUNNING…' : 'RUN SIMULATION'}
        </button>
        {hasChanges && (
          <button onClick={reset} style={{
            background: 'linear-gradient(135deg, #1a1d2e, #141728)',
            border: '1px solid #ffffff08', borderRadius: 10,
            color: '#3a4060', cursor: 'pointer', padding: '11px 14px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#6a7090'}
          onMouseLeave={e => e.currentTarget.style.color = '#3a4060'}
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>

      {result && (
        <div style={{ marginTop: 14,
          background: 'linear-gradient(145deg, #080b14, #060810)',
          borderRadius: 12, padding: 14,
          border: `1px solid ${safer ? '#00d4aa20' : '#ff303020'}`,
          boxShadow: `0 0 30px ${safer ? '#00d4aa10' : '#ff303010'}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'BASELINE', value: `${baseFp}%`, color: '#4a5070' },
              { label: 'WHAT-IF',  value: `${whatFp}%`, color: safer ? '#00d4aa' : '#ff3030' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '10px',
                background: '#0a0d18', borderRadius: 8, border: '1px solid #ffffff06' }}>
                <div style={{ fontSize: 8, color: '#2a3050', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color,
                  textShadow: `0 0 20px ${s.color}44` }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 12px', background: (safer ? '#00d4aa' : '#ff3030') + '0c',
            borderRadius: 8, border: `1px solid ${(safer ? '#00d4aa' : '#ff3030')}25` }}>
            <span style={{ fontSize: 10, color: '#4a5070' }}>Failure probability change</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: safer ? '#00d4aa' : '#ff3030',
              display: 'flex', alignItems: 'center', gap: 5,
              textShadow: `0 0 16px ${safer ? '#00d4aa' : '#ff3030'}66` }}>
              {safer ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              {delta >= 0 ? '+' : ''}{(delta * 100).toFixed(1)}%
            </span>
          </div>
          {result.whatif.status && (
            <div style={{ marginTop: 8, fontSize: 10, color: '#3a4060', textAlign: 'center' }}>
              Predicted status:{' '}
              <span style={{ color: result.whatif.status === 'CRITICAL' ? '#ff3030' : result.whatif.status === 'WARNING' ? '#ffb800' : '#00d4aa', fontWeight: 700 }}>
                {result.whatif.status}
              </span>
              {' · '}RUL: {result.whatif.rul_cycles} cycles
            </div>
          )}
        </div>
      )}
    </div>
  )
}
