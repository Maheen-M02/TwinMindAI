import React, { useRef, useEffect, useState } from 'react'
import { LineChart, Line, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const BUFFER_SIZE = 60

const CHARTS = [
  { key: 's4',  label: 'HPC Outlet Temp', color: '#ff6b35', unit: '°', baseline: 1407 },
  { key: 's11', label: 'HPC Pressure',    color: '#ffb800', unit: '',  baseline: 47.5 },
  { key: 's9',  label: 'Bleed Enthalpy',  color: '#00d4aa', unit: '',  baseline: 9055 },
  { key: 's12', label: 'Fuel Flow',       color: '#cc44ff', unit: '',  baseline: 522  },
]

function MiniChart({ data, dataKey, color, label, unit, baseline }) {
  const current = data.length ? data[data.length - 1][dataKey] : null
  const prev    = data.length > 1 ? data[data.length - 2][dataKey] : current
  const trend   = current != null && prev != null ? current - prev : 0
  const up      = trend > 0.01
  const down    = trend < -0.01

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0a0d18, #080b14)',
      borderRadius: 12, padding: '12px 14px',
      border: '1px solid #ffffff08',
      boxShadow: `0 0 20px ${color}08, inset 0 1px 0 #ffffff06`,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Color accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}66, transparent)`,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 9, color: '#3a4060', fontWeight: 700, letterSpacing: '0.08em' }}>
          {label.toUpperCase()}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {(up || down) && (
            <span style={{ fontSize: 9, color: up ? '#ff6b35' : '#00d4aa', fontWeight: 700 }}>
              {up ? '▲' : '▼'} {Math.abs(trend).toFixed(2)}
            </span>
          )}
          <span style={{ fontSize: 14, fontWeight: 800, color,
            textShadow: `0 0 16px ${color}66` }}>
            {current != null ? `${current.toFixed(1)}${unit}` : '—'}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={52}>
        <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <ReferenceLine y={baseline} stroke={color + '20'} strokeDasharray="3 3" />
          <Line type="monotone" dataKey={dataKey} stroke={color} dot={false}
            strokeWidth={1.5} isAnimationActive={false} />
          <Tooltip
            contentStyle={{
              background: '#0a0d18', border: `1px solid ${color}40`,
              borderRadius: 8, fontSize: 11, padding: '5px 10px',
              boxShadow: `0 4px 20px #00000080, 0 0 20px ${color}20`,
            }}
            itemStyle={{ color }}
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
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span className="label">Sensor Streams</span>
        <span style={{ fontSize: 9, color: '#2a3050' }}>
          last {BUFFER_SIZE}s · cycle {machine?.cycle ?? '—'}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {CHARTS.map(c => (
          <MiniChart key={c.key} data={chartData} dataKey={c.key}
            color={c.color} label={c.label} unit={c.unit} baseline={c.baseline} />
        ))}
      </div>
    </div>
  )
}
