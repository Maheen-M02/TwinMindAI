import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useWebSocket } from './hooks/useWebSocket'
import NavShell       from './components/NavShell'
import OverviewPage   from './pages/OverviewPage'
import TwinPage       from './pages/TwinPage'
import AnalyticsPage  from './pages/AnalyticsPage'
import CostsPage      from './pages/CostsPage'
import BlockchainPage from './pages/BlockchainPage'
import AIPage         from './pages/AIPage'
import Landing        from './pages/Landing'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/factory'

// ── Dashboard shell (all /dashboard/* routes) ─────────────────────────────────
function Dashboard() {
  const { data, status, lastUpdate, recommendations } = useWebSocket(WS_URL)
  const navigate = useNavigate()

  const [route, setRoute] = useState(
    window.location.pathname.replace('/dashboard', '') || '/'
  )

  useEffect(() => {
    const sync = () => {
      setRoute(window.location.pathname.replace('/dashboard', '') || '/')
    }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const nav = (path) => {
    const full = path === '/' ? '/dashboard' : `/dashboard${path}`
    window.history.pushState({}, '', full)
    setRoute(path)
  }

  const alertCount = data
    ? Object.values(data).filter(m => m.status !== 'HEALTHY').length
    : 0

  const twinMatch = route.match(/^\/twin\/(.+)$/)
  const machineId = twinMatch ? twinMatch[1] : (data ? Object.keys(data)[0] : 'M1')

  const renderPage = () => {
    const base = route === '/' ? '/' : '/' + route.split('/')[1]
    switch (base) {
      case '/twin':       return <TwinPage       data={data} machineId={machineId} navigate={nav} recommendations={recommendations} />
      case '/analytics':  return <AnalyticsPage  data={data} navigate={nav} />
      case '/costs':      return <CostsPage      data={data} />
      case '/blockchain': return <BlockchainPage data={data} />
      case '/ai':         return <AIPage         data={data} />
      default:            return <OverviewPage   data={data} navigate={nav} />
    }
  }

  return (
    <NavShell
      route={route}
      navigate={nav}
      wsStatus={status}
      lastUpdate={lastUpdate}
      alertCount={alertCount}
      data={data}
    >
      {renderPage()}
    </NavShell>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<Landing />} />
        <Route path="/dashboard"  element={<Dashboard />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
