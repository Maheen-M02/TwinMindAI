import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, LayoutDashboard, Cpu, FlaskConical,
  DollarSign, Link, Bot, Wifi, WifiOff, AlertTriangle,
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/',           icon: LayoutDashboard, label: 'Overview'     },
  { path: '/twin',       icon: Cpu,             label: 'Digital Twin' },
  { path: '/analytics',  icon: FlaskConical,    label: 'Analytics'    },
  { path: '/costs',      icon: DollarSign,      label: 'Cost Impact'  },
  { path: '/blockchain', icon: Link,            label: 'Blockchain'   },
  { path: '/ai',         icon: Bot,             label: 'AI Copilot'   },
]

const CONN = {
  connected:    { color: '#00a888', label: 'LIVE' },
  connecting:   { color: '#ff9500', label: 'CONNECTING' },
  reconnecting: { color: '#ff9500', label: 'RECONNECTING' },
  error:        { color: '#ff3b30', label: 'OFFLINE' },
}

export default function NavShell({ route, navigate, wsStatus, lastUpdate, alertCount, data, children }) {
  const conn = CONN[wsStatus] || CONN.connecting
  const activePath = route === '/' ? '/' : '/' + route.split('/')[1]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 230, flexShrink: 0,
        background: '#ffffff',
        borderRight: '2px solid #e0e0e0',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        boxShadow: '4px 0 12px rgba(0,0,0,0.05)',
      }}>

        {/* Logo */}
        <div style={{ padding: '26px 20px 22px', borderBottom: '2px solid #e0e0e0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 12,
              background: 'linear-gradient(135deg, #00a88820, #00a88830)',
              border: '3px solid #00a888',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,168,136,0.2)',
            }}>
              <Zap size={26} color="#00a888" strokeWidth={3} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.12em', color: '#000000' }}>
                TWINMIND
              </div>
              <div style={{ fontSize: 11, color: '#00a888', letterSpacing: '0.22em', marginTop: 2,
                fontWeight: 800 }}>
                AI PLATFORM
              </div>
            </div>
          </div>
        </div>

        {/* Connection */}
        <div style={{ padding: '14px 18px', borderBottom: '2px solid #e0e0e0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10,
            background: conn.color + '15', borderRadius: 10, padding: '10px 14px',
            border: `3px solid ${conn.color}` }}>
            {wsStatus === 'connected'
              ? <Wifi size={16} color={conn.color} strokeWidth={3} />
              : <WifiOff size={16} color={conn.color} strokeWidth={3} />}
            <span style={{ fontSize: 12, color: conn.color, fontWeight: 900, letterSpacing: '0.12em',
              animation: wsStatus === 'connected' ? 'blink 3s infinite' : 'none' }}>
              {conn.label}
            </span>
            {lastUpdate && (
              <span style={{ fontSize: 11, color: '#666666', marginLeft: 'auto', fontWeight: 700 }}>
                {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = activePath === path
            return (
              <button key={path} onClick={() => navigate(path)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px', borderRadius: 12, border: 'none',
                background: active
                  ? 'linear-gradient(135deg, #00a88820, #00a88810)'
                  : 'transparent',
                color: active ? '#00a888' : '#333333',
                cursor: 'pointer', fontSize: 15,
                fontWeight: active ? 900 : 700,
                textAlign: 'left', width: '100%',
                transition: 'all 0.15s',
                borderLeft: `4px solid ${active ? '#00a888' : 'transparent'}`,
                boxShadow: active ? 'inset 0 1px 0 rgba(0,168,136,0.1)' : 'none',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#000000' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#333333' } }}
              >
                <Icon size={20} strokeWidth={active ? 3 : 2.5} />
                {label}
                {path === '/ai' && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, background: 'linear-gradient(90deg,#00a888,#008866)',
                    color: '#ffffff', borderRadius: 5, padding: '4px 8px', fontWeight: 900 }}>AI</span>
                )}
                {active && (
                  <div style={{ position: 'absolute', right: 14, width: 8, height: 8,
                    borderRadius: '50%', background: '#00a888', boxShadow: '0 0 8px rgba(0,168,136,0.5)' }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* Machine list */}
        {data && (
          <div style={{ padding: '14px 10px 16px', borderTop: '2px solid #e0e0e0' }}>
            <div style={{ fontSize: 12, color: '#333333', fontWeight: 900, letterSpacing: '0.14em',
              marginBottom: 12, paddingLeft: 6 }}>MACHINES</div>
            {Object.values(data).map(m => {
              const c = m.status === 'CRITICAL' ? '#ff3b30' : m.status === 'WARNING' ? '#ff9500' : '#00a888'
              const active = route === `/twin/${m.machine_id}`
              return (
                <button key={m.machine_id} onClick={() => navigate(`/twin/${m.machine_id}`)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  background: active ? c + '15' : 'transparent',
                  border: `3px solid ${active ? c : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.15s', marginBottom: 4,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f5f5f5' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0,
                    boxShadow: `0 0 8px ${c}80`,
                    animation: m.status === 'CRITICAL' ? 'blink 0.7s infinite' : 'none',
                  }} />
                  <span style={{ fontSize: 15, fontWeight: 900, color: active ? c : '#333333' }}>
                    {m.machine_id}
                  </span>
                  <span style={{ fontSize: 14, color: active ? '#000000' : '#666666', marginLeft: 'auto',
                    fontWeight: 800 }}>
                    {m.health_score?.toFixed(0)}%
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Alert badge */}
        {alertCount > 0 && (
          <div style={{ margin: '0 10px 18px', padding: '13px 16px', borderRadius: 12,
            background: '#ff3b3015',
            border: '3px solid #ff3b30',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 2px 8px rgba(255,59,48,0.2)' }}>
            <AlertTriangle size={18} color="#ff3b30" strokeWidth={3} />
            <span style={{ fontSize: 14, color: '#ff3b30', fontWeight: 900 }}>
              {alertCount} alert{alertCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </aside>

      {/* ── Page ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden',
        background: '#f5f5f5' }}>
        <AnimatePresence mode="wait">
          <motion.div key={activePath}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
