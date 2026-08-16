import { useEffect, useRef } from 'react'

export function BioParticleCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: 0, y: 0 })
  const ringPosRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    let rafId: number

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
    }

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isInteractive = target.closest('button, a, [role="button"], input, select, textarea, [tabindex]')
      if (dotRef.current && ringRef.current) {
        if (isInteractive) {
          dotRef.current.style.transform = 'translate(-50%, -50%) scale(2.2)'
          dotRef.current.style.background = 'radial-gradient(circle, #5ee8e2, #00d4c8)'
          ringRef.current.style.transform = 'translate(-50%, -50%) scale(1.8)'
          ringRef.current.style.borderColor = 'rgba(0, 212, 200, 0.6)'
        } else {
          dotRef.current.style.transform = 'translate(-50%, -50%) scale(1)'
          dotRef.current.style.background = 'var(--cyan-300)'
          ringRef.current.style.transform = 'translate(-50%, -50%) scale(1)'
          ringRef.current.style.borderColor = 'rgba(0, 212, 200, 0.4)'
        }
      }
    }

    const onClick = () => {
      if (ringRef.current) {
        ringRef.current.style.transform = 'translate(-50%, -50%) scale(2.5)'
        ringRef.current.style.opacity = '0'
        setTimeout(() => {
          if (ringRef.current) {
            ringRef.current.style.transition = 'none'
            ringRef.current.style.transform = 'translate(-50%, -50%) scale(1)'
            ringRef.current.style.opacity = '1'
            setTimeout(() => { if (ringRef.current) ringRef.current.style.transition = '' }, 50)
          }
        }, 250)
      }
    }

    const animate = () => {
      ringPosRef.current.x += (posRef.current.x - ringPosRef.current.x) * 0.12
      ringPosRef.current.y += (posRef.current.y - ringPosRef.current.y) * 0.12

      if (dotRef.current) {
        dotRef.current.style.left = `${posRef.current.x}px`
        dotRef.current.style.top = `${posRef.current.y}px`
      }
      if (ringRef.current) {
        ringRef.current.style.left = `${ringPosRef.current.x}px`
        ringRef.current.style.top = `${ringPosRef.current.y}px`
      }
      rafId = requestAnimationFrame(animate)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('click', onClick)
    rafId = requestAnimationFrame(animate)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('click', onClick)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="custom-cursor"
        style={{
          position: 'fixed',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: 'var(--cyan-300)',
          boxShadow: '0 0 10px rgba(0, 212, 200, 0.8)',
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.2s ease, background 0.2s ease',
          willChange: 'left, top',
        }}
      />
      {/* Trailing ring */}
      <div
        ref={ringRef}
        className="custom-cursor"
        style={{
          position: 'fixed',
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '1.5px solid rgba(0, 212, 200, 0.4)',
          boxShadow: '0 0 8px rgba(0, 212, 200, 0.15)',
          pointerEvents: 'none',
          zIndex: 9998,
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.3s ease, border-color 0.2s ease, opacity 0.25s ease',
          willChange: 'left, top',
        }}
      />
    </>
  )
}
