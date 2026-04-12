import React, { useState, useRef, useEffect } from 'react'
import { Bot, Send, Wrench, Sparkles, Zap } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const QUICK_ACTIONS = [
  (mid) => `What is the current health status of ${mid}?`,
  (mid) => `Why is ${mid} showing elevated failure probability?`,
  ()    => 'Which machine is most at risk of failure right now?',
  ()    => 'Estimate total downtime cost if all critical machines fail.',
  (mid) => `What maintenance action should I take for ${mid}?`,
  ()    => 'Compare the health of all three machines.',
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      animation: 'fadeIn 0.2s ease' }}>
      {!isUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: '#00d4aa18',
            border: '1px solid #00d4aa35', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={10} color="#00d4aa" />
          </div>
          <span style={{ fontSize: 9, color: '#00d4aa', fontWeight: 700, letterSpacing: '0.08em' }}>TWINMIND AI</span>
        </div>
      )}
      <div style={{
        maxWidth: 640,
        background: isUser ? '#00d4aa14' : '#13161e',
        border: `1px solid ${isUser ? '#00d4aa30' : '#1e2130'}`,
        borderRadius: isUser ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
        padding: '11px 15px', fontSize: 13, lineHeight: 1.65, color: '#d8d8d8',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.text}
      </div>
      {msg.tools?.length > 0 && (
        <div style={{ marginTop: 5, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {msg.tools.map((t, j) => (
            <span key={j} style={{ fontSize: 9, background: '#1e2130', borderRadius: 4,
              padding: '2px 7px', color: '#555', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Wrench size={8} /> {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AIPage({ data }) {
  const machines = data ? Object.keys(data) : ['M1', 'M2', 'M3']
  const [selectedMachine, setSelectedMachine] = useState(machines[0] || 'M1')
  const machine = data?.[selectedMachine]

  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: 'TwinMind AI online. I have live access to all sensor streams, ML predictions, failure history, and cost models.\n\nAsk me anything about your factory.',
    tools: [],
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #1e2130', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: '#00d4aa18',
              border: '1px solid #00d4aa35', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} color="#00d4aa" />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#e8e8e8' }}>AI Copilot</h1>
              <p style={{ fontSize: 11, color: '#555', marginTop: 1 }}>
                Gemini 2.0 Flash · LangChain tools · live factory context
              </p>
            </div>
          </div>

          {/* Machine context selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: '#444' }}>Context:</span>
            {machines.map(id => {
              const m = data?.[id]
              const c = m?.status === 'CRITICAL' ? '#ff3030' : m?.status === 'WARNING' ? '#ffb800' : '#00d4aa'
              const active = id === selectedMachine
              return (
                <button key={id} onClick={() => setSelectedMachine(id)} style={{
                  background: active ? c + '20' : '#13161e',
                  border: `1px solid ${active ? c + '55' : '#1e2130'}`,
                  borderRadius: 7, padding: '5px 12px', cursor: 'pointer',
                  color: active ? c : '#555', fontSize: 11, fontWeight: 700,
                  transition: 'all 0.15s',
                }}>
                  {id}
                </button>
              )
            })}
          </div>
        </div>

        {/* Machine context strip */}
        {machine && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Status',    value: machine.status,                                  color: machine.status === 'CRITICAL' ? '#ff3030' : machine.status === 'WARNING' ? '#ffb800' : '#00d4aa' },
              { label: 'Health',    value: `${machine.health_score?.toFixed(1)}%`,          color: '#888' },
              { label: 'Fail Prob', value: `${(machine.failure_prob * 100).toFixed(1)}%`,   color: '#888' },
              { label: 'RUL',       value: `${machine.rul_cycles} cycles`,                  color: '#888' },
              { label: 'Anomaly',   value: machine.is_anomaly ? 'YES' : 'No',               color: machine.is_anomaly ? '#ff3030' : '#555' },
            ].map(s => (
              <div key={s.label} style={{ background: '#13161e', border: '1px solid #1e2130',
                borderRadius: 6, padding: '4px 10px', display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: '#444' }}>{s.label}:</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((m, i) => <Message key={i} msg={m} />)}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: '#00d4aa18',
              border: '1px solid #00d4aa35', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={10} color="#00d4aa" />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4aa',
                  animation: `blink 1s infinite ${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      <div style={{ padding: '10px 24px', borderTop: '1px solid #1e2130',
        display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: '#333', alignSelf: 'center', marginRight: 2 }}>
          <Sparkles size={9} style={{ display: 'inline', marginRight: 3 }} />QUICK
        </span>
        {QUICK_ACTIONS.map((fn, i) => {
          const label = fn(selectedMachine)
          return (
            <button key={i} onClick={() => send(label)} disabled={loading} style={{
              background: '#13161e', border: '1px solid #1e2130', borderRadius: 6,
              color: '#666', fontSize: 10, padding: '5px 10px', cursor: 'pointer',
              transition: 'all 0.15s', lineHeight: 1.4,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#00d4aa44'; e.currentTarget.style.color = '#aaa' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2130'; e.currentTarget.style.color = '#666' }}
            >
              {label.length > 48 ? label.slice(0, 48) + '…' : label}
            </button>
          )
        })}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #1e2130',
        display: 'flex', gap: 10, flexShrink: 0 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
          placeholder={`Ask about ${selectedMachine}, failure predictions, costs…`}
          style={{
            flex: 1, background: '#13161e', border: '1px solid #1e2130',
            borderRadius: 10, color: '#e8e8e8', padding: '11px 16px',
            fontSize: 13, outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = '#00d4aa44'}
          onBlur={e => e.target.style.borderColor = '#1e2130'}
        />
        <button onClick={() => send(input)} disabled={loading || !input.trim()} style={{
          background: input.trim() ? '#00d4aa' : '#1e2130',
          border: 'none', borderRadius: 10, padding: '11px 18px',
          cursor: input.trim() ? 'pointer' : 'not-allowed',
          color: input.trim() ? '#0f1117' : '#444',
          transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontWeight: 700,
        }}>
          <Send size={14} /> Send
        </button>
      </div>
    </div>
  )
}
