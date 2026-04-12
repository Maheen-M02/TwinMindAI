import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Bot } from 'lucide-react'
import MachineTwin from '../components/MachineTwin'
import SensorChart from '../components/SensorChart'
import AlertBanner from '../components/AlertBanner'
import ProactiveAgent from '../components/ProactiveAgent'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const STATUS_COLOR = { HEALTHY: '#00d4aa', WARNING: '#ffb800', CRITICAL: '#ff3030' }

export default function TwinPage({ data, machineId, navigate, recommendations = [] }) {
  const machines   = data ? Object.keys(data) : ['M1', 'M2', 'M3']
  const currentIdx = machines.indexOf(machineId)
  const machine    = data?.[machineId]
  const status     = machine?.status || 'HEALTHY'
  const color      = STATUS_COLOR[status]

  const prev = () => navigate(`/twin/${machines[(currentIdx - 1 + machines.length) % machines.length]}`)
  const next = () => navigate(`/twin/${machines[(currentIdx + 1) % machines.length]}`)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <AlertBanner data={data} />

      {/* Header */}
      <div style={{
        padding: '18px 24px 16px', borderBottom: '1px solid #ffffff06',
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'linear-gradient(90deg, #0d112008, transparent)',
      }}>
        <button onClick={() => navigate('/')} style={{
          background: 'linear-gradient(135deg, #1a1d2e, #141728)',
          border: '1px solid #ffffff08', borderRadius: 8,
          color: '#4a5070', cursor: 'pointer', padding: '6px 12px',
          fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#8a8aa0'}
        onMouseLeave={e => e.currentTarget.style.color = '#4a5070'}
        >
          <ChevronLeft size={13} /> Overview
        </button>

        {/* Machine switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={prev} style={{ background: '#1a1d2e', border: '1px solid #ffffff08',
            borderRadius: 7, color: '#4a5070', cursor: 'pointer', padding: '5px 8px' }}>
            <ChevronLeft size={13} />
          </button>
          {machines.map(id => {
            const m = data?.[id]
            const c = STATUS_COLOR[m?.status] || '#00d4aa'
            const active = id === machineId
            return (
              <button key={id} onClick={() => navigate(`/twin/${id}`)} style={{
                background: active ? c + '18' : 'transparent',
                border: `1px solid ${active ? c + '50' : '#ffffff08'}`,
                borderRadius: 8, padding: '5px 14px', cursor: 'pointer',
                color: active ? c : '#3a4060', fontSize: 11, fontWeight: 700,
                transition: 'all 0.15s',
                boxShadow: active ? `0 0 16px ${c}20` : 'none',
              }}>{id}</button>
            )
          })}
          <button onClick={next} style={{ background: '#1a1d2e', border: '1px solid #ffffff08',
            borderRadius: 7, color: '#4a5070', cursor: 'pointer', padding: '5px 8px' }}>
            <ChevronRight size={13} />
          </button>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#e8e8e8', letterSpacing: '-0.01em' }}>
            {machineId} — Digital Twin
          </h1>
          <p style={{ fontSize: 11, color: '#3a4060', marginTop: 2 }}>
            Live sensor stream · ML predictions · autonomous AI management
          </p>
        </div>

        {machine && (
          <span style={{
            fontSize: 9, fontWeight: 800, padding: '5px 12px', borderRadius: 7,
            background: color + '18', color, letterSpacing: '0.1em',
            border: `1px solid ${color}30`,
            boxShadow: `0 0 16px ${color}20`,
            animation: status === 'CRITICAL' ? 'blink 0.7s infinite' : 'none',
          }}>{status}</span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Top row: Twin + Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 16 }}>
          <MachineTwin machine={machine} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SensorChart machine={machine} />

            {/* All sensor readings */}
            {machine && (
              <div className="card" style={{ padding: 16 }}>
                <div className="label" style={{ marginBottom: 12 }}>All Sensor Readings</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
                  {['s2','s3','s4','s6','s7','s8','s9','s11','s12','s13','s14','s15','s17','s18','s20','s21'].map(s => (
                    <div key={s} style={{
                      background: 'linear-gradient(145deg, #0a0d18, #080b14)',
                      borderRadius: 8, padding: '7px 10px',
                      border: '1px solid #ffffff06',
                      boxShadow: 'inset 0 1px 0 #ffffff04',
                    }}>
                      <div style={{ fontSize: 8, color: '#2a3050', marginBottom: 2, letterSpacing: '0.06em' }}>
                        {s.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#6a7090' }}>
                        {machine[s]?.toFixed(2) ?? '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Proactive Agent — full width */}
        <ProactiveAgent wsData={data} />
      </div>
    </div>
  )
}
