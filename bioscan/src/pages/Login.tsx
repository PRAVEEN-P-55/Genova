import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, FlaskConical, ShieldCheck, Microscope, ArrowRight, AlertTriangle } from 'lucide-react'
import { useAuthStore, DEMO_USERS } from '../store/authStore'
import type { UserRole } from '../types'

const ROLE_OPTIONS: { role: UserRole; label: string; description: string; icon: typeof FlaskConical }[] = [
  { role: 'researcher', label: 'Field Researcher', description: 'Upload & analyse eDNA samples, view taxonomy results', icon: FlaskConical },
  { role: 'authority', label: 'Forest Authority', description: 'Monitor sites, review alerts, export compliance reports', icon: ShieldCheck },
  { role: 'lab_technician', label: 'Lab Technician', description: 'Process samples, manage sequencing uploads', icon: Microscope },
]

export default function Login() {
  const navigate = useNavigate()
  const { loginWithBackend } = useAuthStore()
  const [selected, setSelected] = useState<UserRole>('researcher')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    await loginWithBackend(selected)
    setLoading(false)
    navigate('/app/dashboard')
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="glass"
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 480, margin: 24,
          padding: 40,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #00d4c8, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0,212,200,0.4)',
          }}>
            <Activity size={22} color="#030a12" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 22, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              Genova
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              SIH25042 | Team Antigravity
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
          Select Demo Role
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
          This is a demonstration environment. Select a persona to explore Genova.
        </p>

        {/* Role selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {ROLE_OPTIONS.map(({ role, label, description, icon: Icon }) => (
            <button
              key={role}
              onClick={() => setSelected(role)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 12,
                background: selected === role ? 'rgba(0,212,200,0.1)' : 'var(--bg-glass)',
                border: `1px solid ${selected === role ? 'var(--cyan-400)' : 'var(--border-glass)'}`,
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: selected === role ? '0 0 16px rgba(0,212,200,0.15)' : 'none',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: selected === role ? 'rgba(0,212,200,0.2)' : 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s ease',
              }}>
                <Icon size={16} color={selected === role ? 'var(--cyan-300)' : 'var(--text-muted)'} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: selected === role ? 'var(--cyan-300)' : 'var(--text-primary)' }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {description}
                </div>
              </div>
              {selected === role && (
                <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan-400)' }} />
              )}
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '14px 28px', fontSize: 14 }}
        >
          {loading ? (
            <>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(3,10,18,0.3)', borderTopColor: '#030a12', animation: 'spin-slow 0.8s linear infinite' }} />
              Authenticating...
            </>
          ) : (
            <>
              Enter Platform <ArrowRight size={16} />
            </>
          )}
        </button>

        {/* Disclaimer */}
        <div style={{
          marginTop: 20, padding: '10px 14px', borderRadius: 8,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <AlertTriangle size={14} style={{ color: 'var(--amber-400)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Demo environment. All data is simulated for SIH 2025 evaluation. Not for real biodiversity management decisions.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
