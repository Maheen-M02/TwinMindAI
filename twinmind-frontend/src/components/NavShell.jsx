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
  connected:    { color: '#00d4aa', label: 'LIVE' },
  connecting:   { color: '#ffb800', label: 'CONNECTING' },
  reconnecting: { color: '#ffb800', label: 'RECONNECTING' },
  error:        { color: '#ff3030', label: 'OFFLINE' },
}

export default function NavShell({ route, navigate, wsStatus, lastUpdate, alertCount, data, children }) {
  const conn = CONN[wsStatus] || CONN.connecting
  const activePath = route === '/' ? '/' : '/' + route.split('/')[1]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060810' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'linear-gradient(180deg, #0a0d18 0%, #080b14 100%)',
        borderRight: '1px solid #ffffff08',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        boxShadow: '4px 0 24px #00000060',
      }}>

        {/* Logo */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #ffffff06' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #00d4aa22, #00d4aa44)',
              border: '1px solid #00d4aa30',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px #00d4aa22, inset 0 1px 0 #00d4aa30',
              animation: 'glow-pulse 3s ease-in-out infinite',
            }}>
              <Zap size={16} color="#00d4aa" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.12em', color: '#e8e8e8',
                background: 'linear-gradient(90deg, #e8e8e8, #00d4aa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                TWINMIND
              </div>
              <div style={{ fontSize: 8, color: '#00d4aa88', letterSpacing: '0.22em', marginTop: 1 }}>
                AI PLATFORM
              </div>
            </div>
          </div>
        </div>

        {/* Connection */}
        <div style={{ padding: '10px 18px', borderBottom: '1px solid #ffffff06' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7,
            background: conn.color + '0c', borderRadius: 8, padding: '6px 10px',
            border: `1px solid ${conn.color}18` }}>
            {wsStatus === 'connected'
              ? <Wifi size={10} color={conn.color} />
              : <WifiOff size={10} color={conn.color} />}
            <span style={{ fontSize: 9, color: conn.color, fontWeight: 800, letterSpacing: '0.1em',
              animation: wsStatus === 'connected' ? 'blink 3s infinite' : 'none' }}>
              {conn.label}
            </span>
            {lastUpdate && (
              <span style={{ fontSize: 8, color: '#333', marginLeft: 'auto' }}>
                {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = activePath === path
            return (
              <button key={path} onClick={() => navigate(path)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10, border: 'none',
                background: active
                  ? 'linear-gradient(135deg, #00d4aa18, #00d4aa08)'
                  : 'transparent',
                color: active ? '#00d4aa' : '#3a4060',
                cursor: 'pointer', fontSize: 12,
                fontWeight: active ? 700 : 500,
                textAlign: 'left', width: '100%',
                transition: 'all 0.15s',
                borderLeft: `2px solid ${active ? '#00d4aa' : 'transparent'}`,
                boxShadow: active ? 'inset 0 1px 0 #00d4aa18' : 'none',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#ffffff06'; e.currentTarget.style.color = '#6a7090' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3a4060' } }}
              >
                <Icon size={14} />
                {label}
                {path === '/ai' && (
                  <span style={{ marginLeft: 'auto', fontSize: 7, background: 'linear-gradient(90deg,#00d4aa,#00a882)',
                    color: '#060810', borderRadius: 3, padding: '2px 5px', fontWeight: 800 }}>AI</span>
                )}
                {active && (
                  <div style={{ position: 'absolute', right: 10, width: 4, height: 4,
                    borderRadius: '50%', background: '#00d4aa', boxShadow: '0 0 8px #00d4aa' }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* Machine list */}
        {data && (
          <div style={{ padding: '10px 10px 12px', borderTop: '1px solid #ffffff06' }}>
            <div style={{ fontSize: 8, color: '#2a3050', fontWeight: 800, letterSpacing: '0.12em',
              marginBottom: 8, paddingLeft: 4 }}>MACHINES</div>
            {Object.values(data).map(m => {
              const c = m.status === 'CRITICAL' ? '#ff3030' : m.status === 'WARNING' ? '#ffb800' : '#00d4aa'
              const active = route === `/twin/${m.machine_id}`
              return (
                <button key={m.machine_id} onClick={() => navigate(`/twin/${m.machine_id}`)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '7px 10px', borderRadius: 8,
                  background: active ? c + '14' : 'transparent',
                  border: `1px solid ${active ? c + '30' : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.15s', marginBottom: 2,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#ffffff06' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0,
                    boxShadow: `0 0 8px ${c}`,
                    animation: m.status === 'CRITICAL' ? 'blink 0.7s infinite' : 'none',
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: active ? c : '#4a5070' }}>
                    {m.machine_id}
                  </span>
                  <span style={{ fontSize: 10, color: '#2a3050', marginLeft: 'auto' }}>
                    {m.health_score?.toFixed(0)}%
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Alert badge */}
        {alertCount > 0 && (
          <div style={{ margin: '0 10px 14px', padding: '9px 12px', borderRadius: 10,
            background: 'linear-gradient(135deg, #ff303018, #ff303008)',
            border: '1px solid #ff303030',
            display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 0 20px #ff303018' }}>
            <AlertTriangle size={11} color="#ff3030" />
            <span style={{ fontSize: 10, color: '#ff3030', fontWeight: 700 }}>
              {alertCount} alert{alertCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </aside>

      {/* ── Page ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden',
        background: 'radial-gradient(ellipse at 20% 0%, #00d4aa08 0%, transparent 60%), #060810' }}>
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
