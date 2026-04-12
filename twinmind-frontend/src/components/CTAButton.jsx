import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'

export default function CTAButton({ visible }) {
  const btnRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!btnRef.current) return
    if (visible) {
      gsap.to(btnRef.current, {
        opacity: 1, scale: 1, y: 0,
        duration: 0.8, ease: 'power3.out',
        pointerEvents: 'auto',
      })
    } else {
      gsap.to(btnRef.current, {
        opacity: 0, scale: 0.92, y: 12,
        duration: 0.4, ease: 'power2.in',
        pointerEvents: 'none',
      })
    }
  }, [visible])

  const handleClick = () => {
    const overlay = document.getElementById('transition-overlay')
    if (overlay) {
      gsap.to(overlay, {
        opacity: 1, duration: 0.5, ease: 'power2.inOut',
        onComplete: () => navigate('/dashboard'),
      })
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div
        ref={btnRef}
        style={{ opacity: 0, scale: 0.92, transform: 'translateY(12px)', pointerEvents: 'none' }}
      >
        {/* Glow ring */}
        <div style={{
          position: 'absolute', inset: -16, borderRadius: 60,
          background: 'radial-gradient(ellipse, #00d4aa22 0%, transparent 70%)',
          animation: 'cta-pulse 2.5s ease-in-out infinite',
        }} />

        <button
          onClick={handleClick}
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #00d4aa, #00a882)',
            border: 'none',
            borderRadius: 50,
            padding: '18px 52px',
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: '#0a0e14',
            cursor: 'pointer',
            boxShadow: '0 0 40px #00d4aa55, 0 8px 32px #00000080',
            transition: 'transform 0.2s, box-shadow 0.2s',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 0 60px #00d4aa88, 0 12px 40px #00000090'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 0 40px #00d4aa55, 0 8px 32px #00000080'
          }}
        >
          ENTER DASHBOARD
        </button>

        <div style={{
          marginTop: 16, textAlign: 'center',
          fontSize: 11, color: '#00d4aa88',
          letterSpacing: '0.2em', fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          TWINMIND AI · PREDICTIVE MAINTENANCE
        </div>
      </div>

      <style>{`
        @keyframes cta-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.08); }
        }
      `}</style>
    </div>
  )
}
