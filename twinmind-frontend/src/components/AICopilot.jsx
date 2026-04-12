import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, Bot, Wrench, Sparkles } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const QUICK_ACTIONS = [
  (mid) => `Why is ${mid} showing elevated failure probability?`,
  (mid) => `What are the top risk factors for ${mid} right now?`,
  ()    => 'Estimate total downtime cost if all critical machines fail.',
  (mid) => `What-if I reduce fuel flow on ${mid} by 5 units?`,
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      animation: 'fadeIn 0.2s ease',
    }}>
      {!isUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
          <Bot size={11} color="#00d4aa" />
          <span style={{ fontSize: 9, color: '#00d4aa', fontWeight: 700, letterSpacing: '0.06em' }}>TWINMIND AI</span>
        </div>
      )}
      <div style={{
        maxWidth: '88%',
        background: isUser ? '#00d4aa18' : '#13161e',
        border: `1px solid ${isUser ? '#00d4aa35' : '#1e2130'}`,
        borderRadius: isUser ? '12px 12px 4px 12px' : '4px 12px 12px 12px',
        padding: '9px 13px',
        fontSize: 12,
        lineHeight: 1.6,
        color: '#d8d8d8',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.text}
      </div>
      {msg.tools?.length > 0 && (
        <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {msg.tools.map((t, j) => (
            <span key={j} style={{
              fontSize: 9, background: '#1e2130', borderRadius: 4,
              padding: '2px 6px', color: '#555',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <Wrench size={8} /> {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AICopilot({ open, onClose, machine }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: 'TwinMind online. I have access to live sensor data, failure history, and cost models. What do you need?',
    tools: [],
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  const send = async (text) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    setMessages(prev => [...prev, { role: 'user', text: trimmed, tools: [] }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, machine_context: machine }),
      })
      const json = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', text: json.reply, tools: json.tools_called || [] }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Connection error: ${e.message}`, tools: [] }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 38 }}
          style={{
            position: 'fixed', right: 0, top: 0, bottom: 0, width: 400,
            background: '#13161e',
            borderLeft: '1px solid #1e2130',
            display: 'flex', flexDirection: 'column',
            zIndex: 200,
            boxShadow: '-8px 0 40px #00000060',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid #1e2130',
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#0f1117',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: '#00d4aa18', border: '1px solid #00d4aa35',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={14} color="#00d4aa" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#e8e8e8', letterSpacing: '0.05em' }}>TwinMind Copilot</div>
              <div style={{ fontSize: 9, color: '#00d4aa', letterSpacing: '0.08em' }}>GEMINI 1.5 FLASH · LIVE DATA</div>
            </div>
            {machine && (
              <div style={{ marginLeft: 'auto', marginRight: 8, fontSize: 10, color: '#555' }}>
                ctx: <span style={{ color: '#888' }}>{machine.machine_id}</span>
              </div>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 2 }}>
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map((m, i) => <Message key={i} msg={m} />)}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bot size={11} color="#00d4aa" />
                <div style={{ display: 'flex', gap: 3 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: '50%', background: '#00d4aa',
                      animation: `blink 1s infinite ${i * 0.2}s`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick actions */}
          <div style={{ padding: '8px 14px', borderTop: '1px solid #1e2130', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {QUICK_ACTIONS.map((fn, i) => {
              const label = fn(machine?.machine_id || 'M1')
              return (
                <button
                  key={i}
                  onClick={() => send(label)}
                  disabled={loading}
                  style={{
                    background: '#1a1d24', border: '1px solid #1e2130', borderRadius: 5,
                    color: '#666', fontSize: 9, padding: '4px 8px', cursor: 'pointer',
                    transition: 'all 0.15s', lineHeight: 1.4,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#00d4aa44'; e.currentTarget.style.color = '#aaa' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2130'; e.currentTarget.style.color = '#666' }}
                >
                  {label.length > 44 ? label.slice(0, 44) + '…' : label}
                </button>
              )
            })}
          </div>

          {/* Input */}
          <div style={{ padding: '10px 14px 14px', borderTop: '1px solid #1e2130', display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder="Ask about sensors, failures, costs…"
              style={{
                flex: 1, background: '#0f1117', border: '1px solid #1e2130',
                borderRadius: 8, color: '#e8e8e8', padding: '9px 12px',
                fontSize: 12, outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#00d4aa44'}
              onBlur={e => e.target.style.borderColor = '#1e2130'}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              style={{
                background: input.trim() ? '#00d4aa' : '#1e2130',
                border: 'none', borderRadius: 8, padding: '9px 13px',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                color: input.trim() ? '#0f1117' : '#444',
                transition: 'all 0.15s',
              }}
            >
              <Send size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
