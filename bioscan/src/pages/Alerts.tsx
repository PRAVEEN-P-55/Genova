import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, ExternalLink, Bell, BellOff } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { alertsApi } from '../services/api'
import { MOCK_ALERTS } from '../mocks/data'
import type { Alert } from '../types'

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'var(--red-400)',
  HIGH: 'var(--amber-400)',
  MEDIUM: 'var(--cyan-300)',
  LOW: 'var(--text-muted)',
}

const TYPE_ICONS: Record<string, string> = {
  INVASIVE_SPECIES: '🦟',
  CONSERVATION: '🛡️',
  ANOMALY: '🔬',
  BIODIVERSITY_DECLINE: '📉',
}

function AlertCard({ alert, onAcknowledge }: { alert: Alert; onAcknowledge: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const color = SEVERITY_COLORS[alert.severity]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass"
      style={{
        padding: '18px 20px', cursor: 'pointer',
        borderLeft: `3px solid ${color}`,
        opacity: alert.is_acknowledged ? 0.55 : 1,
        boxShadow: alert.severity === 'CRITICAL' && !alert.is_acknowledged ? `0 0 20px ${color}20` : 'none',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: 24, flexShrink: 0 }}>{TYPE_ICONS[alert.alert_type]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              {alert.common_name ? `${alert.common_name} Detection` : alert.alert_type.replace(/_/g, ' ')}
            </span>
            <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color, background: `${color}12`, border: `1px solid ${color}30` }}>
              {alert.severity}
            </span>
            {!alert.is_acknowledged && (
              <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 600, color: 'var(--violet-300)', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                NEW
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {alert.species_name && <span style={{ fontStyle: 'italic' }}>{alert.species_name}</span>}
            {alert.site_name && <span>📍 {alert.site_name}</span>}
            <span>AI Confidence: <strong style={{ color: 'var(--cyan-300)', fontFamily: 'var(--font-mono)' }}>{(alert.confidence * 100).toFixed(0)}%</strong></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {!alert.is_acknowledged && (
            <button
              className="btn btn-ghost"
              style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={e => { e.stopPropagation(); onAcknowledge(alert.alert_id) }}
            >
              <CheckCircle size={13} /> Acknowledge
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-glass)' }}
        >
          {/* Badges row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {alert.iucn_status && (
              <span className={`badge badge-${alert.iucn_status === 'Least Concern' ? 'LC' : alert.iucn_status === 'Near Threatened' ? 'NT' : alert.iucn_status === 'Vulnerable' ? 'VU' : alert.iucn_status === 'Endangered' ? 'EN' : 'CR'}`}>
                IUCN: {alert.iucn_status}
              </span>
            )}
            {alert.wpa_schedule && <span className="badge badge-wpa">WPA {alert.wpa_schedule}</span>}
            {alert.invasive_risk_level && <span className="badge badge-invasive">Invasive Risk: {alert.invasive_risk_level}</span>}
            {alert.sites_affected && <span className="badge badge-ai">{alert.sites_affected.length} sites potentially affected</span>}
          </div>

          {/* Recommended actions */}
          <div style={{ marginBottom: 14 }}>
            <div className="text-label" style={{ marginBottom: 8 }}>Recommended Actions</div>
            <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {alert.recommended_actions.map((action, i) => (
                <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{action}</li>
              ))}
            </ol>
          </div>

          {/* Regulatory reference */}
          {alert.regulatory_reference && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <ExternalLink size={12} color="var(--text-muted)" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ref: {alert.regulatory_reference}</span>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', gap: 8 }}>
            <AlertTriangle size={13} color="var(--amber-400)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>{alert.disclaimer}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS)
  const [filter, setFilter] = useState<'all' | 'unacknowledged'>('all')

  useEffect(() => {
    alertsApi.getAll().then((data) => {
      if (data && data.length > 0) {
        setAlerts(data.map((item: any) => ({
          alert_id: item.alert_id,
          sample_id: item.sample_id,
          site_id: item.site_id,
          site_name: item.site_name,
          alert_type: item.alert_type?.toUpperCase() || 'INVASIVE_SPECIES',
          severity: item.severity?.toUpperCase() || 'HIGH',
          title: item.title,
          description: item.description,
          species_name: item.species_name,
          common_name: item.species_name,
          confidence: 0.96,
          is_acknowledged: Boolean(item.is_acknowledged),
          recommended_actions: Array.isArray(item.recommended_actions) ? item.recommended_actions : ['Deploy containment barriers', 'Notify district conservation board'],
          created_at: item.created_at,
          disclaimer: 'Generated based on eDNA sequencing evidence under WPA regulatory mandate.'
        })))
      }
    }).catch(e => console.warn('[Alerts] Live fetch fallback:', e))
  }, [])

  const acknowledge = (id: string) => {
    alertsApi.acknowledge(id).catch(e => console.warn('[Alerts] Acknowledge error:', e))
    setAlerts(prev => prev.map(a => a.alert_id === id ? { ...a, is_acknowledged: true } : a))
  }

  const displayed = filter === 'all' ? alerts : alerts.filter(a => !a.is_acknowledged)
  const unackCount = alerts.filter(a => !a.is_acknowledged).length

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar title="Conservation Alerts" subtitle="IUCN, WPA & invasive species signal monitoring" />

      <div className="content-area" style={{ padding: 24 }}>
        {/* Filter + stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'unacknowledged'].map(f => (
              <button key={f} onClick={() => setFilter(f as typeof filter)} style={{
                padding: '7px 16px', borderRadius: 100, fontSize: 13, cursor: 'pointer',
                background: filter === f ? 'rgba(0,212,200,0.12)' : 'var(--bg-glass)',
                color: filter === f ? 'var(--cyan-300)' : 'var(--text-muted)',
                border: `1px solid ${filter === f ? 'var(--cyan-400)' : 'var(--border-glass)'}`,
                transition: 'all 0.2s ease', textTransform: 'capitalize',
              }}>
                {f === 'all' ? `All (${alerts.length})` : `Unacknowledged (${unackCount})`}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            {[
              { label: 'CRITICAL', count: alerts.filter(a => a.severity === 'CRITICAL' && !a.is_acknowledged).length, color: 'var(--red-400)' },
              { label: 'HIGH', count: alerts.filter(a => a.severity === 'HIGH' && !a.is_acknowledged).length, color: 'var(--amber-400)' },
              { label: 'MEDIUM', count: alerts.filter(a => a.severity === 'MEDIUM' && !a.is_acknowledged).length, color: 'var(--cyan-300)' },
            ].map(({ label, count, color }) => count > 0 && (
              <span key={label} style={{ padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, color, background: `${color}10`, border: `1px solid ${color}30` }}>
                {count} {label}
              </span>
            ))}
          </div>
        </div>

        {/* Alert cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
              <CheckCircle size={40} style={{ margin: '0 auto 12px', color: 'var(--green-400)' }} />
              <p>All alerts acknowledged. No outstanding alerts.</p>
            </div>
          ) : (
            displayed
              .sort((a, b) => {
                const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
                return (order[a.severity] ?? 4) - (order[b.severity] ?? 4)
              })
              .map(alert => (
                <AlertCard key={alert.alert_id} alert={alert} onAcknowledge={acknowledge} />
              ))
          )}
        </div>

        {/* Platform-level disclaimer */}
        <div style={{ marginTop: 24, padding: '14px 20px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertTriangle size={16} color="var(--red-400)" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Important: eDNA Detection ≠ Confirmed Species Presence
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                All alerts are generated from environmental DNA signal analysis. Detection events represent potential indicators only and must be validated
                through physical survey, morphological identification, and laboratory confirmation before any regulatory notification, enforcement action, or
                public disclosure. Genova supports compliance under the Wildlife Protection Act (1972, amended 2022) and NBSAP guidelines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
