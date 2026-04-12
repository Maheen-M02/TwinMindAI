import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, AlertTriangle, CheckCircle, Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const PRIORITY_CONFIG = {
  CRITICAL: { color: '#ff3030', bg: '#ff303018', border: '#ff303035', icon: AlertTriangle },
  HIGH:     { color: '#ffb800', bg: '#ffb80018', border: '#ffb80035', icon: AlertTriangle },
  MEDIUM:   { color: '#00d4aa', bg: '#00d4aa14', border: '#00d4aa30', icon: Clock        },
  LOW:      { color: '#4a5070', bg: '#4a507014', border: '#4a507025', icon: CheckCircle  },
}

function RecommendationCard({ rec, index }) {
  const [expanded, setExpanded] = useState(index === 0)
  const cfg  = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.LOW
  const Icon = cfg.icon
  const lines = rec.recommendation.split('\n').filter(l => l.trim())

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      style={{
        background: `linear-gradient(145deg, ${cfg.bg}, #0a0d1800)`,
        border: `1px solid ${cfg.border}`,
        borderRadius: 12, overflow: 'hidden',
        boxShadow: `0 0 20px ${cfg.color}10`,
      }}
    >
      <div onClick={() => setExpanded(e => !e)} style={{
        padding: '12px 14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: cfg.color + '20', border: `1px solid ${cfg.color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 12px ${cfg.color}25`,
          animation: rec.priority === 'CRITICAL' ? 'blink 0.8s infinite' : 'none',
        }}>
          <Icon size={13} color={cfg.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <span style={{
              fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
              background: cfg.color + '20', color: cfg.color, letterSpacing: '0.1em',
              border: `1px solid ${cfg.color}30`,
            }}>{rec.priority}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#c8c8d8' }}>
              Machine {rec.machine_id}
            </span>
            <span style={{ fontSize: 9, color: '#3a4060' }}>
              · {rec.failure_prob?.toFixed(1)}% fail · {rec.rul_cycles} cyc RUL
            </span>
          </div>
          {!expanded && (
            <div style={{ fontSize: 10, color: '#4a5070',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lines[0]}
            </div>
          )}
        </div>

        <div style={{ color: '#2a3050', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '12px 14px 14px',
              borderTop: `1px solid ${cfg.color}15`,
            }}>
              {lines.map((line, i) => (
                <p key={i} style={{
                  fontSize: 12, color: '#8888a8', lineHeight: 1.65,
                  marginBottom: i < lines.length - 1 ? 6 : 0,
                }}>{line}</p>
              ))}
              <div style={{ marginTop: 10, fontSize: 9, color: '#2a3050' }}>
                Generated {new Date(rec.ts * 1000).toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ProactiveAgent({ wsData }) {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading]   = useState(false)
  const [lastScan, setLastScan] = useState(null)
  const [agentStatus, setAgentStatus] = useState('monitoring')

  // Register global WS push handler
  useEffect(() => {
    window.__twinmind_push_recs = (recs) => {
      setRecommendations(recs)
      setLastScan(new Date())
      setAgentStatus('monitoring')
    }
    return () => { delete window.__twinmind_push_recs }
  }, [])

  // Auto-fetch on mount after short delay
  useEffect(() => {
    const t = setTimeout(fetchNow, 2500)
    return () => clearTimeout(t)
  }, [])

  async function fetchNow() {
    setLoading(true)
    setAgentStatus('scanning')
    try {
      const res  = await fetch(`${API_URL}/agent/recommendations`)
      const json = await res.json()
      if (json.recommendations?.length > 0) {
        setRecommendations(json.recommendations)
        setLastScan(new Date())
      }
    } catch (e) {
      console.error('[ProactiveAgent]', e)
    } finally {
      setLoading(false)
      setAgentStatus('monitoring')
    }
  }

  const critCount = recommendations.filter(r => r.priority === 'CRITICAL').length
  const highCount = recommendations.filter(r => r.priority === 'HIGH').length

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        background: 'linear-gradient(90deg, #00d4aa0c, transparent)',
        borderBottom: '1px solid #ffffff06',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'linear-gradient(135deg, #00d4aa20, #00d4aa0c)',
          border: '1px solid #00d4aa30',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px #00d4aa20',
          animation: agentStatus === 'scanning' ? 'glow-pulse 1s infinite' : 'glow-pulse 3s infinite',
        }}>
          <Bot size={15} color="#00d4aa" />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#c8c8d8', letterSpacing: '0.04em' }}>
            Autonomous Plant Manager
          </div>
          <div style={{ fontSize: 9, color: '#00d4aa88', letterSpacing: '0.1em', marginTop: 1 }}>
            {agentStatus === 'scanning'
              ? '⟳ SCANNING FACTORY…'
              : '● MONITORING · GEMINI 2.0 FLASH'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {critCount > 0 && (
            <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 5,
              background: '#ff303020', color: '#ff3030', border: '1px solid #ff303030',
              animation: 'blink 0.8s infinite' }}>
              {critCount} CRITICAL
            </span>
          )}
          {highCount > 0 && (
            <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 5,
              background: '#ffb80018', color: '#ffb800', border: '1px solid #ffb80030' }}>
              {highCount} HIGH
            </span>
          )}
        </div>

        <button onClick={fetchNow} disabled={loading} style={{
          background: 'linear-gradient(135deg, #00d4aa18, #00d4aa0c)',
          border: '1px solid #00d4aa25', borderRadius: 8,
          color: '#00d4aa', cursor: 'pointer', padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 10, fontWeight: 700,
          opacity: loading ? 0.6 : 1, transition: 'all 0.15s',
        }}>
          <RefreshCw size={11} style={{ animation: loading ? 'spin-slow 1s linear infinite' : 'none' }} />
          {loading ? 'Scanning…' : 'Scan Now'}
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8,
        maxHeight: 440, overflowY: 'auto' }}>
        {recommendations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: '#00d4aa0c',
              border: '1px solid #00d4aa18',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', animation: 'float 3s ease-in-out infinite',
            }}>
              <Bot size={20} color="#00d4aa44" />
            </div>
            <div style={{ fontSize: 12, color: '#3a4060' }}>
              {loading ? 'Analysing factory data…' : 'Initialising autonomous agent…'}
            </div>
            <div style={{ fontSize: 10, color: '#2a3050', marginTop: 4 }}>
              Auto-scans every 15 seconds · Gemini 2.0 Flash
            </div>
          </div>
        ) : (
          <>
            {recommendations.map((rec, i) => (
              <RecommendationCard key={`${rec.machine_id}-${rec.ts}`} rec={rec} index={i} />
            ))}
            {lastScan && (
              <div style={{ fontSize: 9, color: '#2a3050', textAlign: 'center', paddingTop: 4 }}>
                Last scan: {lastScan.toLocaleTimeString()} · next in ~15s
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
