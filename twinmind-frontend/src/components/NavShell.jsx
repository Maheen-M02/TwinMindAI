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
  connected:    { color: '#00ffb7', label: 'LIVE' },
  connecting:   { color: '#ff9500', label: 'CONNECTING' },
  reconnecting: { color: '#ff9500', label: 'RECONNECTING' },
  error:        { color: '#ff3b30', label: 'OFFLINE' },
}

export default function NavShell({ route, navigate, wsStatus, lastUpdate, alertCount, data, children }) {
  const conn = CONN[wsStatus] || CONN.connecting
  const activePath = route === '/' ? '/' : '/' + route.split('/')[1]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', fontFamily: 'var(--font-body)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 230, flexShrink: 0,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--color-accent-dim)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        boxShadow: '4px 0 24px rgba(0,0,0,0.6)',
      }}>

        {/* Logo */}
        <div style={{ padding: '26px 20px 22px', borderBottom: '1px solid var(--color-accent-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 12,
              background: 'rgba(0, 255, 183, 0.1)',
              border: '2px solid var(--color-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 15px rgba(0, 255, 183, 0.3)',
            }}>
              <Zap size={26} color="var(--color-accent)" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-header)', letterSpacing: '0.12em', color: '#ffffff' }}>
                TWINMIND
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-accent)', letterSpacing: '0.22em', marginTop: 2,
                fontWeight: 800, fontFamily: 'var(--font-header)' }}>
                AI PLATFORM
              </div>
            </div>
          </div>
        </div>

        {/* Connection */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-accent-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(0, 0, 0, 0.3)', borderRadius: 10, padding: '10px 14px',
            border: `1px solid ${conn.color}`, boxShadow: `0 0 10px ${conn.color}15` }}>
            {wsStatus === 'connected'
              ? <Wifi size={16} color={conn.color} strokeWidth={2.5} />
              : <WifiOff size={16} color={conn.color} strokeWidth={2.5} />}
            <span style={{ fontSize: 12, color: conn.color, fontWeight: 900, letterSpacing: '0.12em',
              fontFamily: 'var(--font-mono)',
              animation: wsStatus === 'connected' ? 'blink 3s infinite' : 'none' }}>
              {conn.label}
            </span>
            {lastUpdate && (
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginLeft: 'auto', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
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
                  ? 'rgba(0, 255, 183, 0.08)'
                  : 'transparent',
                color: active ? 'var(--color-accent)' : 'rgba(255,255,255,0.7)',
                cursor: 'pointer', fontSize: 15,
                fontWeight: active ? 800 : 600,
                fontFamily: 'var(--font-header)',
                textAlign: 'left', width: '100%',
                transition: 'all 0.15s',
                borderLeft: `4px solid ${active ? 'var(--color-accent)' : 'transparent'}`,
                boxShadow: active ? 'inset 0 1px 0 rgba(0,255,183,0.05)' : 'none',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#ffffff' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' } }}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {label}
                {path === '/ai' && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, background: 'linear-gradient(90deg, var(--color-accent), #00cc92)',
                    color: '#000000', borderRadius: 5, padding: '4px 8px', fontWeight: 900, fontFamily: 'var(--font-header)' }}>AI</span>
                )}
                {active && (
                  <div style={{ position: 'absolute', right: 14, width: 8, height: 8,
                    borderRadius: '50%', background: 'var(--color-accent)', boxShadow: '0 0 8px var(--color-accent)' }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* Machine list */}
        {data && (
          <div style={{ padding: '14px 10px 16px', borderTop: '1px solid var(--color-accent-dim)' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 800, letterSpacing: '0.14em',
              marginBottom: 12, paddingLeft: 6, fontFamily: 'var(--font-header)' }}>MACHINES</div>
            {Object.values(data).map(m => {
              const c = m.status === 'CRITICAL' ? '#ff3b30' : m.status === 'WARNING' ? '#ff9500' : '#00ffb7'
              const active = route === `/twin/${m.machine_id}`
              return (
                <button key={m.machine_id} onClick={() => navigate(`/twin/${m.machine_id}`)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  background: active ? c + '15' : 'transparent',
                  border: `1px solid ${active ? c : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.15s', marginBottom: 4,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0,
                    boxShadow: `0 0 8px ${c}80`,
                    animation: m.status === 'CRITICAL' ? 'blink 0.7s infinite' : 'none',
                  }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: active ? c : '#ffffff', fontFamily: 'var(--font-header)' }}>
                    {m.machine_id}
                  </span>
                  <span style={{ fontSize: 14, color: active ? '#ffffff' : 'var(--color-text-secondary)', marginLeft: 'auto',
                    fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
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
            background: 'rgba(255,59,48,0.1)',
            border: '1px solid #ff3b30',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 0 10px rgba(255,59,48,0.15)' }}>
            <AlertTriangle size={18} color="#ff3b30" strokeWidth={2.5} />
            <span style={{ fontSize: 14, color: '#ff3b30', fontWeight: 800, fontFamily: 'var(--font-header)' }}>
              {alertCount} alert{alertCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </aside>

      {/* ── Page ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden',
        background: 'var(--bg-main)' }}>
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

