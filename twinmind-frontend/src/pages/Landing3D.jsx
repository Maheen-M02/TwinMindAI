import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import FaultyTerminal from '../components/FaultyTerminal'

const SYSTEM_LOGS = [
  ">> INITIALIZING TWINMIND MATRIX CORE...",
  ">> SYSTEM STATUS: CONNECTED TO EDGE DEVICE SIMULATION",
  ">> LOADED MODELS: XGBOOST CLASS / XGBOOST REG / ISOLATION FOREST",
  ">> COGNITIVE CORE: GOOGLE GEMINI 1.5 FLASH ADVISORY LAYER ACTIVE",
  ">> ETHEREUM LAYER: SMART CONTRACT 0x82A1... ACTIVE (POLYGON MUMBAI)",
  ">> [TICK] SENSOR READINGS INTAKE: 42 CHANNELS ACTIVE",
  ">> RUNNING INFERENCE... STABLE [L: 22ms]",
  ">> TELEMETRY: M1 TEMP 554K | M2 VIB 0.048 | M3 SPEED 2388RPM",
  ">> MODEL UPDATE: RUL ESTIMATOR STABLE AT WARPING DELAY 30c",
  ">> BLOCKCHAIN EVENT RESOLVED: COMPLIANCE INTEGRITY RECORDED ON-CHAIN",
  ">> CO-PILOT: RECONSTRUCTING DIGITAL TWIN STATE SPACE MAP...",
  ">> DEBOUNCER: STATUS OK. BLOCKCHAIN WRITE QUEUE CLEAR",
  ">> PROACTIVE AGENT: MONITORING THERMODYNAMIC VECTORS FOR DEVIATION",
]

export default function Landing3D() {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)
  const [logs, setLogs] = useState([SYSTEM_LOGS[0], SYSTEM_LOGS[1], SYSTEM_LOGS[2]])
  const logIndexRef = useRef(3)
  const consoleEndRef = useRef(null)

  // Append a live log message every 1.8 seconds to make the UI feel alive
  useEffect(() => {
    const logInterval = setInterval(() => {
      setLogs((prev) => {
        const nextLog = SYSTEM_LOGS[logIndexRef.current]
        logIndexRef.current = (logIndexRef.current + 1) % SYSTEM_LOGS.length
        // Keep last 8 logs
        return [...prev.slice(-7), nextLog]
      })
    }, 1800)

    return () => clearInterval(logInterval)
  }, [])

  // Auto scroll console logs
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Share+Tech+Mono&family=Inter:wght@300;400;500;600;700&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    setTimeout(() => setLoaded(true), 400)
  }, [])

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#000000',
      overflow: 'hidden',
      position: 'relative',
      color: '#ffffff',
      fontFamily: '"Inter", sans-serif'
    }}>
      {/* Background Terminal Effect */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        <FaultyTerminal
          scale={1.3}
          gridMul={[3.5, 1.5]}
          digitSize={1.1}
          timeScale={0.8}
          pause={false}
          scanlineIntensity={0.8}
          glitchAmount={1.1}
          flickerAmount={0.8}
          noiseAmp={1.0}
          chromaticAberration={0.4}
          dither={0.15}
          curvature={0.12}
          tint="#00ffb7"
          mouseReact={false}
          mouseStrength={0.0}
          pageLoadAnimation={false}
          brightness={0.7}
        />
      </div>

      {/* Dark Vignette Overlay for Depth */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        background: 'radial-gradient(ellipse at center, transparent 20%, #000000f2 100%)',
      }} />

      {/* Futuristic Grid Overlay lines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
        backgroundImage: 'linear-gradient(to right, rgba(0, 255, 183, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 255, 183, 0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Main Layout */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        display: 'grid', gridTemplateColumns: '1.2fr 1fr', padding: '60px 80px',
        alignItems: 'center', boxSizing: 'border-box', zIndex: 10
      }}>
        
        {/* Left Console: Information & Actions */}
        <motion.div 
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: loaded ? 1 : 0, x: loaded ? 0 : -60 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}
        >
          {/* Logo & Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#00ffb7', boxShadow: '0 0 12px #00ffb7',
              animation: 'pulse 1.8s infinite ease-in-out'
            }} />
            <span style={{
              fontSize: '14px', fontWeight: 800, letterSpacing: '0.4em',
              fontFamily: '"Outfit", sans-serif', color: '#00ffb7', textTransform: 'uppercase'
            }}>
              PROJECT TWINMIND
            </span>
          </div>

          {/* Title */}
          <div>
            <h1 style={{
              fontSize: '76px', fontWeight: 900, fontFamily: '"Outfit", sans-serif',
              letterSpacing: '-0.02em', lineHeight: '0.95', margin: 0,
              background: 'linear-gradient(135deg, #ffffff 30%, #00ffb7 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(0, 255, 183, 0.2)'
            }}>
              INTELLIGENT<br/>
              DIGITAL TWIN
            </h1>
            <p style={{
              fontSize: '18px', color: '#8a99ad', fontWeight: 400,
              marginTop: '15px', lineHeight: '1.6', maxWidth: '520px'
            }}>
              High-fidelity predictive maintenance utilizing real-time ML pipelines, interactive AI diagnostics, and tamper-proof blockchain telemetry logging.
            </p>
          </div>

          {/* Call to Action */}
          <div style={{ pointerEvents: 'auto', marginTop: '10px' }}>
            <button 
              onClick={() => navigate('/dashboard')} 
              style={{
                background: 'transparent',
                border: '1px solid rgba(0, 255, 183, 0.4)',
                borderRadius: '8px',
                padding: '18px 44px',
                fontSize: '15px',
                fontWeight: 700,
                color: '#00ffb7',
                cursor: 'pointer',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontFamily: '"Outfit", sans-serif',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 0 20px rgba(0, 255, 183, 0.05), inset 0 0 10px rgba(0, 255, 183, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(0, 255, 183, 0.1)';
                e.target.style.borderColor = '#00ffb7';
                e.target.style.boxShadow = '0 0 35px rgba(0, 255, 183, 0.3), inset 0 0 15px rgba(0, 255, 183, 0.1)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.borderColor = 'rgba(0, 255, 183, 0.4)';
                e.target.style.boxShadow = '0 0 20px rgba(0, 255, 183, 0.05), inset 0 0 10px rgba(0, 255, 183, 0.05)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              INITIALIZE INTERFACE &rarr;
            </button>
            
            <div style={{
              fontSize: '11px', color: '#556880', marginTop: '14px',
              fontFamily: '"Share Tech Mono", monospace', letterSpacing: '0.1em'
            }}>
              // CURSOR DISTORTION ENABLED // SYSTEM ONLINE
            </div>
          </div>
        </motion.div>

        {/* Right Console: Holographic Telemetry & Live Streams */}
        <motion.div 
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: loaded ? 1 : 0, x: loaded ? 0 : 60 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '30px', boxSizing: 'border-box' }}
        >
          {/* Live System Console Output */}
          <div style={{
            background: 'rgba(5, 10, 8, 0.85)',
            border: '1px solid rgba(0, 255, 183, 0.15)',
            borderRadius: '12px',
            padding: '24px',
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: '12px',
            color: '#00ffb7',
            height: '220px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Console Header Bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '32px',
              background: 'rgba(0, 255, 183, 0.05)', borderBottom: '1px solid rgba(0, 255, 183, 0.1)',
              display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '10px', color: '#a3f0d2', letterSpacing: '0.05em' }}>SYSTEM MONITOR LOGS</span>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%', background: '#00ffb7',
                boxShadow: '0 0 8px #00ffb7', animation: 'pulse 1s infinite'
              }} />
            </div>

            {/* Scrollable logs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'hidden', marginTop: '16px' }}>
              <AnimatePresence initial={false}>
                {logs.map((log, i) => (
                  <motion.div 
                    key={log + i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      color: i === logs.length - 1 ? '#ffffff' : 'rgba(0, 255, 183, 0.6)'
                    }}
                  >
                    {log}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={consoleEndRef} />
            </div>
          </div>

          {/* Telemetry Stats Panel */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'
          }}>
            {/* Stat 1 */}
            <div style={{
              borderLeft: '2px solid #00ffb7',
              paddingLeft: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{
                fontSize: '11px', color: '#556880', fontFamily: '"Outfit", sans-serif',
                fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase'
              }}>
                ML Accuracy
              </span>
              <span style={{
                fontSize: '32px', fontWeight: 400, fontFamily: '"Share Tech Mono", monospace',
                color: '#ffffff', textShadow: '0 0 10px rgba(255,255,255,0.2)', lineHeight: '1'
              }}>
                91.23%
              </span>
            </div>

            {/* Stat 2 */}
            <div style={{
              borderLeft: '2px solid #00d4ff',
              paddingLeft: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{
                fontSize: '11px', color: '#556880', fontFamily: '"Outfit", sans-serif',
                fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase'
              }}>
                Latency
              </span>
              <span style={{
                fontSize: '32px', fontWeight: 400, fontFamily: '"Share Tech Mono", monospace',
                color: '#ffffff', textShadow: '0 0 10px rgba(255,255,255,0.2)', lineHeight: '1'
              }}>
                &lt;50ms
              </span>
            </div>

            {/* Stat 3 */}
            <div style={{
              borderLeft: '2px solid #ff00ff',
              paddingLeft: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{
                fontSize: '11px', color: '#556880', fontFamily: '"Outfit", sans-serif',
                fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase'
              }}>
                Warning Frame
              </span>
              <span style={{
                fontSize: '32px', fontWeight: 400, fontFamily: '"Share Tech Mono", monospace',
                color: '#ffffff', textShadow: '0 0 10px rgba(255,255,255,0.2)', lineHeight: '1'
              }}>
                30-100c
              </span>
            </div>

            {/* Stat 4 */}
            <div style={{
              borderLeft: '2px solid #ffb800',
              paddingLeft: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{
                fontSize: '11px', color: '#556880', fontFamily: '"Outfit", sans-serif',
                fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase'
              }}>
                Sensor Streams
              </span>
              <span style={{
                fontSize: '32px', fontWeight: 400, fontFamily: '"Share Tech Mono", monospace',
                color: '#ffffff', textShadow: '0 0 10px rgba(255,255,255,0.2)', lineHeight: '1'
              }}>
                42 Chs
              </span>
            </div>
          </div>

        </motion.div>

      </div>

      {/* CSS Animation helper */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
        }
      `}</style>
    </div>
  )
}
