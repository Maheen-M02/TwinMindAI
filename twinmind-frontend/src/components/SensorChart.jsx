import React, { useRef, useEffect, useState } from 'react'
import { LineChart, Line, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const BUFFER_SIZE = 60

const CHARTS = [
  { key: 's4',  label: 'HPC Outlet Temp', color: '#ff6b35', unit: '°', baseline: 1407 },
  { key: 's11', label: 'HPC Pressure',    color: '#ff9500', unit: '',  baseline: 47.5 },
  { key: 's9',  label: 'Bleed Enthalpy',  color: '#00a888', unit: '',  baseline: 9055 },
  { key: 's12', label: 'Fuel Flow',       color: '#af52de', unit: '',  baseline: 522  },
]

function MiniChart({ data, dataKey, color, label, unit, baseline }) {
  const current = data.length ? data[data.length - 1][dataKey] : null
  const prev    = data.length > 1 ? data[data.length - 2][dataKey] : current
  const trend   = current != null && prev != null ? current - prev : 0
  const up      = trend > 0.01
  const down    = trend < -0.01

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 14, padding: '16px 18px',
      border: '3px solid #e0e0e0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Color accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: color,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: '#333333', fontWeight: 900, letterSpacing: '0.12em' }}>
          {label.toUpperCase()}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(up || down) && (
            <span style={{ fontSize: 13, color: up ? '#ff6b35' : '#00a888', fontWeight: 900 }}>
              {up ? '▲' : '▼'} {Math.abs(trend).toFixed(2)}
            </span>
          )}
          <span style={{ fontSize: 20, fontWeight: 900, color }}>
            {current != null ? `${current.toFixed(1)}${unit}` : '—'}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <ReferenceLine y={baseline} stroke={color + '40'} strokeDasharray="3 3" strokeWidth={2} />
          <Line type="monotone" dataKey={dataKey} stroke={color} dot={false}
            strokeWidth={3} isAnimationActive={false} />
          <Tooltip
            contentStyle={{
              background: '#ffffff', border: `3px solid ${color}`,
              borderRadius: 10, fontSize: 14, padding: '8px 14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
            itemStyle={{ color, fontWeight: 900 }}
            labelFormatter={() => ''}
            formatter={(v) => [`${v?.toFixed(2)}${unit}`, label]}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function SensorChart({ machine }) {
  const bufferRef = useRef([])
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    if (!machine) return
    const point = { tick: machine.cycle }
    CHARTS.forEach(c => { point[c.key] = machine[c.key] })
    bufferRef.current = [...bufferRef.current.slice(-(BUFFER_SIZE - 1)), point]
    setChartData([...bufferRef.current])
  }, [machine?.cycle])

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <span className="label">Sensor Streams</span>
        <span style={{ fontSize: 13, color: '#333333', fontWeight: 800 }}>
          last {BUFFER_SIZE}s · cycle {machine?.cycle ?? '—'}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {CHARTS.map(c => (
          <MiniChart key={c.key} data={chartData} dataKey={c.key}
            color={c.color} label={c.label} unit={c.unit} baseline={c.baseline} />
        ))}
      </div>
    </div>
  )
}
