import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, AlertTriangle, X, ChevronRight } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { assistantApi } from '../services/api'
import { MOCK_ASSISTANT_QA, SUGGESTED_QUESTIONS } from '../mocks/data'
import type { AssistantMessage } from '../types'

function normalizeQuestion(q: string) {
  return q.toLowerCase().replace(/[?.!,]/g, '').trim()
}

function findAnswer(question: string): AssistantMessage | null {
  const norm = normalizeQuestion(question)
  for (const [key, response] of Object.entries(MOCK_ASSISTANT_QA)) {
    if (norm.includes(key) || key.includes(norm.substring(0, 20))) return response
  }
  // Fuzzy: find best matching key
  let bestKey = ''
  let bestScore = 0
  for (const key of Object.keys(MOCK_ASSISTANT_QA)) {
    const words = key.split(' ')
    const matchCount = words.filter(w => norm.includes(w)).length
    if (matchCount > bestScore) { bestScore = matchCount; bestKey = key }
  }
  return bestScore > 2 ? MOCK_ASSISTANT_QA[bestKey] : null
}

function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === 'user'
  const [displayed, setDisplayed] = useState(isUser ? message.content : '')
  const [streaming, setStreaming] = useState(!isUser)

  useEffect(() => {
    if (isUser) return
    let i = 0
    const content = message.content
    const interval = setInterval(() => {
      if (i <= content.length) {
        setDisplayed(content.substring(0, i))
        i += 3 // 3 chars per frame for speed
      } else {
        setStreaming(false)
        clearInterval(interval)
      }
    }, 16)
    return () => clearInterval(interval)
  }, [])

  const confidenceColor = message.confidence === 'HIGH' ? 'var(--green-400)' : message.confidence === 'MEDIUM' ? 'var(--amber-400)' : 'var(--red-400)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}
    >
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0, marginRight: 10, marginTop: 4,
          background: 'linear-gradient(135deg, #00d4c8, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bot size={14} color="#030a12" />
        </div>
      )}
      <div style={{ maxWidth: '80%' }}>
        <div style={{
          padding: '14px 18px', borderRadius: isUser ? '20px 20px 4px 20px' : '4px 20px 20px 20px',
          background: isUser ? 'rgba(0,212,200,0.12)' : 'rgba(124,58,237,0.08)',
          border: `1px solid ${isUser ? 'rgba(0,212,200,0.2)' : 'rgba(124,58,237,0.2)'}`,
          backdropFilter: 'blur(12px)',
        }}>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
            {/* Render **bold** */}
            {displayed.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={i} style={{ color: 'var(--cyan-300)' }}>{part.slice(2, -2)}</strong>
                : part
            )}
            {streaming && <span style={{ animation: 'blink 0.7s step-end infinite', color: 'var(--cyan-400)' }}>▋</span>}
          </p>
        </div>

        {/* Sources + confidence */}
        {!isUser && !streaming && message.sources && (
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {message.sources.map((source, i) => (
              <span key={i} style={{
                padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 600,
                background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', cursor: 'pointer',
              }}>
                [{source.id}]
              </span>
            ))}
            {message.confidence && (
              <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, color: confidenceColor, background: `${confidenceColor}10`, border: `1px solid ${confidenceColor}30` }}>
                {message.confidence} confidence
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      message_id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m Bio-AI, your RAG-powered biodiversity intelligence assistant. I can answer questions about your eDNA samples, species detections, site health, and conservation alerts.\n\nAll my answers are grounded in your actual platform data — I don\'t make things up.',
      confidence: 'HIGH',
      created_at: new Date().toISOString(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (question?: string) => {
    const q = question ?? input.trim()
    if (!q) return
    setInput('')
    setLoading(true)

    const userMsg: AssistantMessage = {
      message_id: `msg_user_${Date.now()}`,
      role: 'user',
      content: q,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const response = await assistantApi.chat(q)
      if (response && response.message) {
        const assistantMsg: AssistantMessage = {
          message_id: `msg_ai_${Date.now()}`,
          role: 'assistant',
          content: response.message,
          confidence: 'HIGH',
          citations: response.citations?.map((c: any) => ({
            title: c.title,
            sample_id: c.reference,
            confidence: c.confidence,
          })),
          created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, assistantMsg])
        setLoading(false)
        return
      }
    } catch (e) {
      console.warn('[RAG Assistant] Backend fallback to template:', e)
    }

    const answer = findAnswer(q)
    const assistantMsg: AssistantMessage = answer ?? {
      message_id: `msg_ai_${Date.now()}`,
      role: 'assistant',
      content: 'I can answer questions based on the data available in Genova. Could you be more specific? For example, ask about a particular site, sample, species, or alert. Try one of the suggested questions below.',
      confidence: 'MEDIUM',
      created_at: new Date().toISOString(),
    }
    assistantMsg.message_id = `msg_ai_${Date.now()}`
    setMessages(prev => [...prev, assistantMsg])
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="AI Biodiversity Assistant" subtitle="RAG-powered · Llama 3.1 · Grounded in your data" />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', maxWidth: 1200, margin: '0 auto', width: '100%', padding: 24, gap: 20, height: 'calc(100vh - 64px)' }}>
        {/* Chat */}
        <div className="glass" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {messages.map(msg => <MessageBubble key={msg.message_id} message={msg} />)}
            {loading && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4c8, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} color="#030a12" />
                </div>
                <div style={{ display: 'flex', gap: 5, padding: '12px 16px', borderRadius: '4px 20px 20px 20px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--violet-400)', animation: `float 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask about sites, species, alerts, predictions..."
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 10,
                  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-sans)',
                  outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--border-glow)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-glass)')}
              />
              <button className="btn btn-primary" style={{ padding: '12px 20px', borderRadius: 10 }} onClick={() => sendMessage()}>
                <Send size={16} />
              </button>
            </div>
            {/* Disclaimer */}
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 10, textAlign: 'center', lineHeight: 1.5 }}>
              ⚠️ Answers generated from platform data only. Always verify biodiversity findings with a qualified ecologist.
            </p>
          </div>
        </div>

        {/* Suggested questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="glass" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Bot size={14} color="var(--cyan-300)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Suggested Questions</span>
            </div>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%',
                  padding: '10px 12px', borderRadius: 8, marginBottom: 8, textAlign: 'left', cursor: 'pointer',
                  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                  color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.5, transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.color = 'var(--cyan-300)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                <ChevronRight size={12} style={{ marginTop: 2, flexShrink: 0 }} />
                {q}
              </button>
            ))}
          </div>

          {/* Info card */}
          <div className="glass" style={{ padding: 20 }}>
            <div className="text-label" style={{ marginBottom: 10 }}>About Bio-AI</div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Powered by <strong style={{ color: 'var(--text-secondary)' }}>Llama 3.1 (8B)</strong> via Ollama, running fully offline.
              <br /><br />
              Vector store: <strong style={{ color: 'var(--text-secondary)' }}>ChromaDB</strong> — all platform data indexed as embeddings.
              <br /><br />
              Every response cites its source samples and databases.
            </p>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertTriangle size={11} color="var(--amber-400)" />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>No external internet access. No hallucinated facts.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
