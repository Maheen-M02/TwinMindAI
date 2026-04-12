import React, { useState } from 'react'
import { FlaskConical, Activity } from 'lucide-react'
import WhatIfPanel from '../components/WhatIfPanel'
import EventLog from '../components/EventLog'

const STATUS_COLOR = { HEALTHY: '#00d4aa', WARNING: '#ffb800', CRITICAL: '#ff3030' }

export default function AnalyticsPage({ data }) {
  const machines = data ? Object.keys(data) : ['M1']
  const [selectedMachine, setSelectedMachine] = useState(machines[0] || 'M1')
  const machine = data?.[selectedMachine]

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#e8e8e8' }}>Analytics</h1>
        <p style={{ fontSize: 12, color: '#555', marginTop: 3 }}>
          What-if simulations · failure event history · ML driver analysis
        </p>
      </div>

      {/* Machine selector */}
      <div style={{ display: 'flex', gap: 8 }}>
        {machines.map(id => {
          const m = data?.[id]
          const c = STATUS_COLOR[m?.status] || '#00d4aa'
          const active = id === selectedMachine
          return (
            <button key={id} onClick={() => setSelectedMachine(id)} style={{
              background: active ? c + '20' : '#13161e',
              border: `1px solid ${active ? c + '60' : '#1e2130'}`,
              borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
              color: active ? c : '#555', fontSize: 11, fontWeight: 700,
              transition: 'all 0.15s',
            }}>
              {id}
              {m && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>{m.health_score?.toFixed(0)}%</span>}
            </button>
          )
        })}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* What-If */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <FlaskConical size={14} color="#00d4aa" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e8e8e8' }}>What-If Simulator</span>
            <span style={{ fontSize: 10, color: '#555', marginLeft: 4 }}>
              — adjust sensors, predict outcome
            </span>
          </div>

          {/* Current machine stats */}
          {machine && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Health',    value: `${machine.health_score?.toFixed(1)}%`,          color: STATUS_COLOR[machine.status] },
                { label: 'Fail Prob', value: `${(machine.failure_prob * 100).toFixed(1)}%`,   color: machine.failure_prob > 0.7 ? '#ff3030' : machine.failure_prob > 0.4 ? '#ffb800' : '#00d4aa' },
                { label: 'RUL',       value: `${machine.rul_cycles} cyc`,                     color: '#888' },
              ].map(s => (
                <div key={s.label} style={{ background: '#0f1117', borderRadius: 7, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#555', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          <WhatIfPanel machine={machine} />
        </div>

        {/* Event Log */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Activity size={14} color="#ffb800" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e8e8e8' }}>Event Log</span>
            <span style={{ fontSize: 10, color: '#555', marginLeft: 4 }}>
              — WARNING / CRITICAL history
            </span>
          </div>
          <EventLog />
        </div>
      </div>

      {/* ML top drivers for selected machine */}
      {machine?.top_drivers?.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e8e8', marginBottom: 14 }}>
            ML Failure Drivers — {selectedMachine}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {machine.top_drivers.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: '#888', width: 220, flexShrink: 0 }}>{d.label}</span>
                <div style={{ flex: 1, background: '#0f1117', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, d.importance * 100 * 8)}%`,
                    height: '100%',
                    background: i === 0 ? '#ff3030' : i === 1 ? '#ffb800' : '#00d4aa',
                    borderRadius: 3, transition: 'width 0.5s',
                  }} />
                </div>
                <span style={{ fontSize: 11, color: '#555', width: 40, textAlign: 'right' }}>
                  {(d.importance * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
