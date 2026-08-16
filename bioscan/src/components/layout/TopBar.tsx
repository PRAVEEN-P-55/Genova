import { Bell, Search, PanelLeft, PanelLeftClose } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { MOCK_ALERTS } from '../../mocks/data'

interface TopBarProps {
  title: string
  subtitle?: string
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { user } = useAuthStore()
  const { isSidebarOpen, toggleSidebar } = useUIStore()
  const unackAlerts = MOCK_ALERTS.filter(a => !a.is_acknowledged).length

  return (
    <header style={{
      height: 64,
      padding: '0 24px',
      borderBottom: '1px solid var(--border-glass)',
      background: 'rgba(6, 14, 28, 0.8)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={toggleSidebar}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 8,
            background: 'transparent', border: '1px solid transparent',
            color: 'var(--text-secondary)', cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-glass)'; e.currentTarget.style.borderColor = 'var(--border-glass)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
        </button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Search hint */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 14px', borderRadius: 8,
          background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
          color: 'var(--text-muted)', fontSize: 13,
        }}>
          <Search size={14} />
          <span>Search sites, samples...</span>
          <span style={{
            padding: '1px 6px', borderRadius: 4, fontSize: 10,
            background: 'var(--border-glass)', color: 'var(--text-dim)',
            fontFamily: 'var(--font-mono)',
          }}>⌘K</span>
        </div>

        {/* Alerts bell */}
        <button style={{
          position: 'relative', width: 38, height: 38, borderRadius: 10,
          background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s ease',
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-glow)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-glass)')}
        >
          <Bell size={16} color="var(--text-secondary)" />
          {unackAlerts > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              width: 18, height: 18, borderRadius: '50%',
              background: 'var(--red-500)', color: '#fff',
              fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse-glow 2s infinite',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
            }}>
              {unackAlerts}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00d4c8, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600, color: '#fff',
          cursor: 'pointer', boxShadow: '0 0 12px rgba(0, 212, 200, 0.3)',
        }}>
          {user?.name.charAt(0) ?? 'U'}
        </div>
      </div>
    </header>
  )
}
