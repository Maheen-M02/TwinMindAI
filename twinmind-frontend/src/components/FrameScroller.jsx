import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CanvasRenderer from './CanvasRenderer'
import CTAButton from './CTAButton'

gsap.registerPlugin(ScrollTrigger)

const TOTAL_FRAMES = 240
const SCROLL_MULTIPLIER = 20   // px of scroll per frame → 240 * 20 = 4800px total scroll
const FRAME_PATH = (i) => `/frames/frame_${String(i).padStart(4, '0')}.png`

const OVERLAYS = [
  { start: 0,   end: 45,  title: 'THE MACHINE',   sub: 'Industrial systems operating at the edge of failure' },
  { start: 65,  end: 115, title: 'DEGRADATION',    sub: 'Sensors detect anomalies before humans can' },
  { start: 135, end: 178, title: 'DIGITAL TWIN',   sub: 'AI constructs a real-time predictive model' },
  { start: 198, end: 238, title: 'TWINMIND AI',    sub: 'Predict. Prevent. Protect.' },
]

export default function FrameScroller() {
  const [loaded, setLoaded]     = useState(false)
  const [loadPct, setLoadPct]   = useState(0)
  const [showCTA, setShowCTA]   = useState(false)
  const [overlay, setOverlay]   = useState(null)

  const canvasRef   = useRef(null)
  const pinRef      = useRef(null)   // the outer tall div (scroll driver)
  const stickyRef   = useRef(null)   // the sticky viewport div
  const overlayRef  = useRef(null)
  const imagesRef   = useRef([])
  const frameRef    = useRef({ index: 0 })

  // ── Preload ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const imgs = new Array(TOTAL_FRAMES)
    let done = 0

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image()
      img.src = FRAME_PATH(i + 1)
      img.onload = img.onerror = () => {
        done++
        setLoadPct(Math.round((done / TOTAL_FRAMES) * 100))
        if (done === TOTAL_FRAMES) {
          imagesRef.current = imgs
          setLoaded(true)
        }
      }
      imgs[i] = img
    }
    imagesRef.current = imgs
  }, [])

  // ── ScrollTrigger pin + scrub ──────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return

    // Draw first frame
    canvasRef.current?.drawFrame(0)

    const totalScroll = TOTAL_FRAMES * SCROLL_MULTIPLIER

    const ctx = gsap.context(() => {
      // Animate a proxy object so we get smooth scrubbed values
      gsap.to(frameRef.current, {
        index: TOTAL_FRAMES - 1,
        ease: 'none',
        scrollTrigger: {
          trigger: pinRef.current,
          start: 'top top',
          end: `+=${totalScroll}`,
          pin: stickyRef.current,   // pin the sticky viewport, not the outer div
          pinSpacing: false,        // outer div already provides the space
          scrub: 1,                 // 1s lag for smoothness
          onUpdate: (self) => {
            const idx = Math.round(self.progress * (TOTAL_FRAMES - 1))
            canvasRef.current?.drawFrame(idx)

            // CTA
            setShowCTA(self.progress >= 0.95)

            // Text overlay
            let found = null
            for (const o of OVERLAYS) {
              if (idx >= o.start && idx <= o.end) { found = o; break }
            }
            setOverlay(prev => {
              if (prev?.title === found?.title) return prev
              return found
            })
          },
        },
      })
    })

    return () => ctx.revert()
  }, [loaded])

  // ── Overlay fade ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!overlayRef.current) return
    if (overlay) {
      gsap.to(overlayRef.current, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
    } else {
      gsap.to(overlayRef.current, { opacity: 0, y: 14, duration: 0.35, ease: 'power2.in' })
    }
  }, [overlay])

  return (
    <>
      {/* ── Loading screen ── */}
      {!loaded && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: '#0a0e14',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 24,
        }}>
          <div style={{ fontSize: 11, color: '#00d4aa', letterSpacing: '0.3em', fontWeight: 700,
            fontFamily: 'Inter, system-ui, sans-serif' }}>
            TWINMIND AI
          </div>
          <div style={{ width: 260, height: 2, background: '#1a1d24', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: '#00d4aa', width: `${loadPct}%`,
              transition: 'width 0.15s linear', boxShadow: '0 0 10px #00d4aa',
            }} />
          </div>
          <div style={{ fontSize: 11, color: '#444', letterSpacing: '0.15em',
            fontFamily: 'Inter, system-ui, sans-serif' }}>
            LOADING FRAMES {loadPct}%
          </div>
        </div>
      )}

      {/* ── Outer scroll driver (tall) ── */}
      <div
        ref={pinRef}
        style={{ height: `${TOTAL_FRAMES * SCROLL_MULTIPLIER + window.innerHeight}px`, position: 'relative' }}
      >
        {/* ── Sticky viewport (pinned by GSAP) ── */}
        <div
          ref={stickyRef}
          style={{
            width: '100vw', height: '100vh',
            position: 'relative', overflow: 'hidden',
            background: '#0a0e14',
            // Will be pinned to top:0 by GSAP
            top: 0,
          }}
        >
          {/* Canvas */}
          <CanvasRenderer ref={canvasRef} images={imagesRef.current} />

          {/* Vignette */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, transparent 35%, #0a0e1466 100%)',
          }} />

          {/* Bottom gradient */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 200,
            background: 'linear-gradient(to top, #0a0e14dd, transparent)',
            pointerEvents: 'none',
          }} />

          {/* Top gradient */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 120,
            background: 'linear-gradient(to bottom, #0a0e14bb, transparent)',
            pointerEvents: 'none',
          }} />

          {/* Logo */}
          <div style={{
            position: 'absolute', top: 32, left: 40,
            display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#00d4aa', boxShadow: '0 0 10px #00d4aa',
              animation: 'tm-blink 2s infinite',
            }} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', color: '#e8e8e8' }}>
              TWINMIND AI
            </span>
          </div>

          {/* Scroll hint */}
          <div style={{
            position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            opacity: showCTA ? 0 : 1, transition: 'opacity 0.5s',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            <span style={{ fontSize: 9, color: '#555', letterSpacing: '0.22em' }}>SCROLL TO EXPLORE</span>
            <div style={{
              width: 1, height: 44,
              background: 'linear-gradient(to bottom, #00d4aa, transparent)',
              animation: 'tm-scrollline 1.6s ease-in-out infinite',
            }} />
          </div>

          {/* Text overlay */}
          <div
            ref={overlayRef}
            style={{
              position: 'absolute', bottom: 110, left: 56,
              opacity: 0, transform: 'translateY(14px)',
              maxWidth: 500, fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {overlay && (
              <>
                <div style={{
                  fontSize: 10, color: '#00d4aa', letterSpacing: '0.28em',
                  fontWeight: 700, marginBottom: 10, textTransform: 'uppercase',
                }}>
                  {overlay.title}
                </div>
                <div style={{
                  fontSize: 24, color: '#e8e8e8cc', fontWeight: 300,
                  lineHeight: 1.45, letterSpacing: '0.01em',
                  textShadow: '0 2px 24px #00000099',
                }}>
                  {overlay.sub}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <CTAButton visible={showCTA} />

      {/* Fade-to-black transition overlay */}
      <div id="transition-overlay" style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: '#0a0e14', opacity: 0, pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes tm-blink    { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes tm-scrollline { 0%,100%{opacity:0.2;transform:scaleY(0.5)} 50%{opacity:1;transform:scaleY(1)} }
      `}</style>
    </>
  )
}
