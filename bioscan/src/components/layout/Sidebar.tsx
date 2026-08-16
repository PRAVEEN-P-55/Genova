import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import {
  LayoutDashboard, Upload, FlaskConical, Dna, Map, TrendingUp,
  Bot, FileText, LogOut, Activity
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/upload', icon: Upload, label: 'Upload Sample' },
  { to: '/app/samples', icon: FlaskConical, label: 'Samples' },
  { to: '/app/taxonomy/EDNA-IND-00142', icon: Dna, label: 'Taxonomy' },
  { to: '/app/map', icon: Map, label: 'Biodiversity Map' },
  { to: '/app/predictions', icon: TrendingUp, label: 'Predictions' },
  { to: '/app/assistant', icon: Bot, label: 'AI Assistant' },
  { to: '/app/reports', icon: FileText, label: 'Reports' },
]

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const { isSidebarOpen } = useUIStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: isSidebarOpen ? 240 : 0,
        opacity: isSidebarOpen ? 1 : 0
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{
        minHeight: '100vh',
        background: 'rgba(6, 14, 28, 0.95)',
        borderRight: '1px solid var(--border-glass)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid var(--border-glass)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #00d4c8, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0, 212, 200, 0.4)',
            flexShrink: 0,
          }}>
            <Activity size={18} color="#030a12" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Genova
            </div>
            <div style={{ fontSize: 10, color: 'var(--cyan-500)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              SIH25042
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 10,
              marginBottom: 2,
              color: isActive ? 'var(--cyan-300)' : 'var(--text-muted)',
              background: isActive ? 'rgba(0, 212, 200, 0.08)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--cyan-400)' : '2px solid transparent',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            })}
          >
            <Icon size={16} />
            <span style={{ flex: 1 }}>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{
        padding: '16px 12px',
        borderTop: '1px solid var(--border-glass)',
      }}>
        {user && (
          <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-glass)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
              {user.name}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: 100,
              background: 'rgba(0, 212, 200, 0.12)', color: 'var(--cyan-300)',
              border: '1px solid rgba(0, 212, 200, 0.25)',
            }}>
              {user.role}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '8px 12px', borderRadius: 8,
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--red-400)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </motion.aside>
  )
}
