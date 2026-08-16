import { useEffect, useRef, useState } from 'react'

const BOOT_LINES = [
  { text: '[GENOVA] INITIALIZING BIO-INTELLIGENCE SYSTEM', delay: 0, class: 'text-cyan-300 font-bold' },
  { text: '', delay: 200 },
  { text: 'Loading molecular environment ............', delay: 400 },
  { text: 'Loading reference databases ..............', delay: 700 },
  { text: 'Calibrating taxonomic models .............', delay: 1000 },
  { text: '', delay: 1200 },
  { text: '████████████████████████████████ 100%', delay: 1300, class: 'text-cyan-400' },
  { text: '', delay: 1600 },
  { text: 'DNA ENGINE            [ ONLINE ]', delay: 1700, class: 'text-green-400' },
  { text: 'TAXONOMY ENGINE       [ ONLINE ]', delay: 1900, class: 'text-green-400' },
  { text: 'BIODIVERSITY ENGINE   [ ONLINE ]', delay: 2100, class: 'text-green-400' },
  { text: 'AI ENGINE             [ ONLINE ]', delay: 2300, class: 'text-green-400' },
  { text: 'GEOSPATIAL CORE       [ ONLINE ]', delay: 2500, class: 'text-green-400' },
  { text: '', delay: 2700 },
  { text: '──────────────────────────────────────────────', delay: 2800, class: 'text-cyan-900' },
  { text: 'SYSTEM READY. COMMENCE ANALYSIS.', delay: 2900, class: 'text-cyan-300 font-bold tracking-widest' },
]

interface BootSequenceProps {
  onComplete: () => void
}

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState<number[]>([])
  const [exiting, setExiting] = useState(false)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    BOOT_LINES.forEach((line, idx) => {
      setTimeout(() => {
        setVisibleLines(prev => [...prev, idx])
      }, line.delay)
    })

    // Exit after last line + brief pause
    const totalDuration = BOOT_LINES[BOOT_LINES.length - 1].delay + 600
    setTimeout(() => setExiting(true), totalDuration)
    setTimeout(onComplete, totalDuration + 500)
  }, [onComplete])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'var(--bg-void)',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
        pointerEvents: exiting ? 'none' : 'all',
      }}
    >
      {/* Scan lines overlay */}
      <div
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,200,0.015) 2px, rgba(0,212,200,0.015) 4px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ fontFamily: 'var(--font-mono)', maxWidth: 560, width: '100%', padding: '0 24px' }}>
        {/* Logo */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: 'linear-gradient(135deg, #00d4c8, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="none" stroke="#030a12" strokeWidth="1.5"/>
              <path d="M8 8c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="#030a12" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M8 16c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#030a12" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="12" y1="2" x2="12" y2="4" stroke="#030a12" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="12" y1="20" x2="12" y2="22" stroke="#030a12" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 600 }}>
            Genova
          </span>
        </div>

        {/* Terminal lines */}
        <div style={{ fontSize: 13, lineHeight: '1.8', color: 'var(--text-muted)' }}>
          {BOOT_LINES.map((line, idx) => (
            <div
              key={idx}
              className={line.class}
              style={{
                opacity: visibleLines.includes(idx) ? 1 : 0,
                transform: visibleLines.includes(idx) ? 'translateY(0)' : 'translateY(4px)',
                transition: 'opacity 0.2s ease, transform 0.2s ease',
                minHeight: line.text ? undefined : '1em',
                color: line.class?.includes('text-cyan-300') ? 'var(--cyan-300)'
                  : line.class?.includes('text-green-400') ? 'var(--green-400)'
                  : line.class?.includes('text-cyan-400') ? 'var(--cyan-400)'
                  : line.class?.includes('text-cyan-900') ? 'var(--cyan-900)'
                  : 'var(--text-muted)',
                fontWeight: line.class?.includes('font-bold') ? 600 : 400,
                letterSpacing: line.class?.includes('tracking-widest') ? '0.14em' : undefined,
              }}
            >
              {line.text || '\u00A0'}
              {idx === visibleLines[visibleLines.length - 1] && !exiting && (
                <span style={{ animation: 'blink 1s step-end infinite', color: 'var(--cyan-300)' }}>█</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
