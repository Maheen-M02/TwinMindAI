import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Maximize2, Minimize2 } from 'lucide-react'

const STATUS_COLOR = { HEALTHY: '#00d4aa', WARNING: '#ffb800', CRITICAL: '#ff3030' }
const STATUS_BG    = { HEALTHY: '#00d4aa', WARNING: '#ffb800', CRITICAL: '#ff3030' }

// Fixed floor-plan positions for each machine (% of SVG viewBox 800×440)
const MACHINE_POSITIONS = {
  M1: { x: 180, y: 160, label: 'Press Line A',    zone: 'Zone 1' },
  M2: { x: 400, y: 120, label: 'CNC Lathe B',     zone: 'Zone 2' },
  M3: { x: 620, y: 160, label: 'Turbine Unit C',  zone: 'Zone 2' },
  M4: { x: 180, y: 300, label: 'Conveyor D',      zone: 'Zone 3' },
  M5: { x: 400, y: 300, label: 'Compressor E',    zone: 'Zone 3' },
  M6: { x: 620, y: 300, label: 'Heat Exchanger F',zone: 'Zone 4' },
}

// Pipe/conveyor connections between machines
const CONNECTIONS = [
  ['M1', 'M2'], ['M2', 'M3'],
  ['M1', 'M4'], ['M2', 'M5'], ['M3', 'M6'],
  ['M4', 'M5'], ['M5', 'M6'],
]

// Zone rectangles [x, y, w, h, label]
const ZONES = [
  { x: 80,  y: 60,  w: 260, h: 160, label: 'ZONE 1 — INTAKE' },
  { x: 300, y: 60,  w: 400, h: 160, label: 'ZONE 2 — PROCESSING' },
  { x: 80,  y: 220, w: 260, h: 160, label: 'ZONE 3 — ASSEMBLY' },
  { x: 300, y: 220, w: 400, h: 160, label: 'ZONE 4 — OUTPUT' },
]

function PulseRing({ x, y, color, critical }) {
  return (
    <>
      <circle cx={x} cy={y} r="28" fill="none" stroke={color} strokeWidth="1"
        style={{ animation: 'map-pulse 2s ease-out infinite', transformOrigin: `${x}px ${y}px` }} />
      {critical && (
        <circle cx={x} cy={y} r="28" fill="none" stroke={color} strokeWidth="1"
          style={{ animation: 'map-pulse 2s ease-out infinite 0.6s', transformOrigin: `${x}px ${y}px` }} />
      )}
    </>
  )
}

function MachineNode({ id, pos, machine, selected, onClick }) {
  const status = machine?.status || 'HEALTHY'
  const color  = STATUS_COLOR[status]
  const health = machine?.health_score ?? 100
  const fp     = (machine?.failure_prob ?? 0) * 100
  const isAnom = machine?.is_anomaly
  const isCrit = status === 'CRITICAL'

  // Arc for health ring: full circle = 2π×22
  const R = 22
  const circ = 2 * Math.PI * R
  const dash = (health / 100) * circ

  return (
    <g
      onClick={() => onClick(id)}
      style={{ cursor: 'pointer' }}
    >
      {/* Pulse rings */}
      {(status !== 'HEALTHY' || isAnom) && (
        <PulseRing x={pos.x} y={pos.y} color={color} critical={isCrit} />
      )}

      {/* Outer glow */}
      {selected && (
        <circle cx={pos.x} cy={pos.y} r="34" fill={color + '18'} stroke={color + '55'} strokeWidth="1.5" />
      )}

      {/* Background circle */}
      <circle cx={pos.x} cy={pos.y} r="26" fill="#13161e" stroke="#1e2130" strokeWidth="1.5" />

      {/* Health arc */}
      <circle
        cx={pos.x} cy={pos.y} r={R}
        fill="none"
        stroke={color + '30'}
        strokeWidth="4"
      />
      <circle
        cx={pos.x} cy={pos.y} r={R}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}  /* start from top */
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />

      {/* Machine ID */}
      <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize="11" fontWeight="800" fill={color} fontFamily="Inter, system-ui, sans-serif">
        {id}
      </text>

      {/* Health % below */}
      <text x={pos.x} y={pos.y + 14} textAnchor="middle"
        fontSize="7" fill={color + 'cc'} fontFamily="Inter, system-ui, sans-serif">
        {health.toFixed(0)}%
      </text>

      {/* Anomaly dot */}
      {isAnom && (
        <circle cx={pos.x + 18} cy={pos.y - 18} r="5" fill="#ff3030"
          style={{ animation: 'blink 0.7s infinite' }} />
      )}

      {/* Label below node */}
      <text x={pos.x} y={pos.y + 42} textAnchor="middle"
        fontSize="8" fill="#555" fontFamily="Inter, system-ui, sans-serif">
        {pos.label}
      </text>
    </g>
  )
}

function Tooltip({ node, machine, pos }) {
  if (!node || !machine) return null
  const color = STATUS_COLOR[machine.status] || '#888'
  const fp = (machine.failure_prob * 100).toFixed(1)

  // Position tooltip so it doesn't go off-screen
  const tx = pos.x > 550 ? pos.x - 140 : pos.x + 40
  const ty = pos.y > 320 ? pos.y - 90  : pos.y - 10

  return (
    <g>
      <rect x={tx} y={ty} width="130" height="80" rx="8"
        fill="#0f1117" stroke={color + '55'} strokeWidth="1" />
      <text x={tx + 10} y={ty + 16} fontSize="10" fontWeight="800" fill={color} fontFamily="Inter, system-ui, sans-serif">
        {node} — {machine.status}
      </text>
      <text x={tx + 10} y={ty + 30} fontSize="8" fill="#888" fontFamily="Inter, system-ui, sans-serif">
        Health: {machine.health_score?.toFixed(1)}%
      </text>
      <text x={tx + 10} y={ty + 43} fontSize="8" fill="#888" fontFamily="Inter, system-ui, sans-serif">
        Fail prob: {fp}%
      </text>
      <text x={tx + 10} y={ty + 56} fontSize="8" fill="#888" fontFamily="Inter, system-ui, sans-serif">
        RUL: {machine.rul_cycles} cycles
      </text>
      <text x={tx + 10} y={ty + 69} fontSize="8" fill="#555" fontFamily="Inter, system-ui, sans-serif">
        {MACHINE_POSITIONS[node]?.zone}
      </text>
    </g>
  )
}

export default function FactoryMap({ data, selectedMachine, onSelect }) {
  const [hovered, setHovered] = useState(null)
  const [expanded, setExpanded] = useState(false)

  // Merge live data with static positions; pad with simulated nodes if data has < 6 machines
  const allNodes = Object.keys(MACHINE_POSITIONS)
  const getMachine = (id) => {
    if (data?.[id]) return data[id]
    // Simulate placeholder for demo scalability
    return { machine_id: id, status: 'HEALTHY', health_score: 95, failure_prob: 0.02, rul_cycles: 800, is_anomaly: false }
  }

  const height = expanded ? 440 : 280

  return (
    <div className="card" style={{ overflow: 'hidden', position: 'relative' }}>
      <style>{`
        @keyframes map-pulse {
          0%   { opacity: 0.8; transform: scale(1); }
          100% { opacity: 0;   transform: scale(1.9); }
        }
        @keyframes flow {
          0%   { stroke-dashoffset: 20; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #1e2130',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <MapPin size={13} color="#00d4aa" />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#888' }}>
            FACTORY FLOOR MAP
          </span>
          <span style={{ fontSize: 9, color: '#444', marginLeft: 4 }}>
            {allNodes.length} machines · click to inspect
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Legend */}
          {[['HEALTHY', '#00d4aa'], ['WARNING', '#ffb800'], ['CRITICAL', '#ff3030']].map(([s, c]) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
              <span style={{ fontSize: 9, color: '#555' }}>{s}</span>
            </div>
          ))}
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 2 }}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* SVG Map */}
      <motion.div
        animate={{ height }}
        transition={{ type: 'spring', stiffness: 200, damping: 28 }}
        style={{ overflow: 'hidden' }}
      >
        <svg
          viewBox="0 0 800 440"
          width="100%"
          height={height}
          style={{ display: 'block', background: '#0d1018' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid dots */}
          {Array.from({ length: 20 }, (_, col) =>
            Array.from({ length: 12 }, (_, row) => (
              <circle key={`${col}-${row}`}
                cx={col * 42 + 14} cy={row * 40 + 14}
                r="1" fill="#1a1d24" />
            ))
          )}

          {/* Zone backgrounds */}
          {ZONES.map((z, i) => (
            <g key={i}>
              <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="8"
                fill="#13161e" stroke="#1e2130" strokeWidth="1" />
              <text x={z.x + 10} y={z.y + 14} fontSize="8" fill="#2a2d34"
                fontWeight="700" letterSpacing="0.08em" fontFamily="Inter, system-ui, sans-serif">
                {z.label}
              </text>
            </g>
          ))}

          {/* Connection pipes */}
          {CONNECTIONS.map(([a, b], i) => {
            const pa = MACHINE_POSITIONS[a]
            const pb = MACHINE_POSITIONS[b]
            const ma = getMachine(a)
            const mb = getMachine(b)
            const bothHealthy = ma.status === 'HEALTHY' && mb.status === 'HEALTHY'
            const anyWarning  = ma.status === 'WARNING'  || mb.status === 'WARNING'
            const anyCritical = ma.status === 'CRITICAL' || mb.status === 'CRITICAL'
            const pipeColor = anyCritical ? '#ff303040' : anyWarning ? '#ffb80040' : '#1e2130'
            const flowColor = anyCritical ? '#ff3030' : anyWarning ? '#ffb800' : '#00d4aa'

            return (
              <g key={i}>
                {/* Pipe base */}
                <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  stroke={pipeColor} strokeWidth="3" strokeLinecap="round" />
                {/* Animated flow dots */}
                <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  stroke={flowColor} strokeWidth="1.5" strokeLinecap="round"
                  strokeDasharray="4 12" opacity="0.6"
                  style={{ animation: `flow ${anyCritical ? '0.6s' : anyWarning ? '1s' : '2s'} linear infinite` }}
                />
              </g>
            )
          })}

          {/* Machine nodes */}
          {allNodes.map(id => {
            const pos = MACHINE_POSITIONS[id]
            const machine = getMachine(id)
            return (
              <g key={id}
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered(null)}
              >
                <MachineNode
                  id={id}
                  pos={pos}
                  machine={machine}
                  selected={selectedMachine === id}
                  onClick={onSelect}
                />
              </g>
            )
          })}

          {/* Hover tooltip */}
          {hovered && (
            <Tooltip
              node={hovered}
              machine={getMachine(hovered)}
              pos={MACHINE_POSITIONS[hovered]}
            />
          )}

          {/* "LIVE" badge */}
          <g>
            <rect x="720" y="410" width="68" height="20" rx="4" fill="#00d4aa18" stroke="#00d4aa33" strokeWidth="1" />
            <circle cx="731" cy="420" r="3" fill="#00d4aa" style={{ animation: 'blink 2s infinite' }} />
            <text x="738" y="424" fontSize="8" fill="#00d4aa" fontWeight="700"
              letterSpacing="0.1em" fontFamily="Inter, system-ui, sans-serif">LIVE</text>
          </g>
        </svg>
      </motion.div>
    </div>
  )
}
