import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { RadialBarChart, RadialBar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Activity, AlertTriangle, MapPin, FlaskConical, TrendingDown, ArrowRight, ExternalLink } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { MOCK_SITES, MOCK_SAMPLES, MOCK_ALERTS, MOCK_TIMESERIES } from '../mocks/data'

function StatCard({ value, label, sub, icon: Icon, color, trend }: { value: string; label: string; sub?: string; icon: typeof Activity; color: string; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <motion.div
      className="glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      style={{ padding: 24, flex: 1 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </div>
        {trend && (
          <span style={{ fontSize: 11, color: trend === 'up' ? 'var(--green-400)' : trend === 'down' ? 'var(--red-400)' : 'var(--text-muted)' }}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {sub}
          </span>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
    </motion.div>
  )
}

const HEALTH_COLOR: Record<string, string> = {
  HEALTHY: 'var(--green-400)',
  MODERATE: 'var(--amber-400)',
  DEGRADED: '#f97316',
  CRITICAL: 'var(--red-400)',
}

const STATUS_COLOR: Record<string, string> = {
  completed: 'var(--green-400)',
  processing: 'var(--cyan-300)',
  queued: 'var(--text-muted)',
  failed: 'var(--red-400)',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const totalSpecies = MOCK_SITES.reduce((s, site) => s + site.species_detected, 0)
  const totalAlerts = MOCK_ALERTS.filter(a => !a.is_acknowledged).length

  const radarData = [
    { name: 'Taxa', value: 75 },
    { name: 'Health', value: 82 },
    { name: 'Diversity', value: 68 },
    { name: 'Native', value: 88 },
  ]

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar title="Dashboard" subtitle="Genova — eDNA Biodiversity Intelligence Platform" />

      <div className="content-area" style={{ padding: 28 }}>
        {/* KPI Row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <StatCard value={String(MOCK_SITES.length)} label="Monitored Sites" sub="2 new" icon={MapPin} color="var(--cyan-400)" trend="up" />
          <StatCard value={String(totalAlerts)} label="Active Alerts" sub="requires attention" icon={AlertTriangle} color="var(--red-400)" trend="down" />
          <StatCard value={String(MOCK_SAMPLES.filter(s => s.status === 'completed').length)} label="Samples Analysed" sub="last 30 days" icon={FlaskConical} color="var(--violet-400)" trend="up" />
          <StatCard value={String(totalSpecies)} label="Species Detected" sub="across all sites" icon={Activity} color="var(--green-400)" trend="up" />
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }}>
          {/* Biodiversity Trend Chart */}
          <motion.div
            className="glass"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ padding: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>Biodiversity Health Trends</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Last 12 months — 4 key sites</p>
              </div>
              <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }}
                onClick={() => navigate('/app/predictions')}>
                Forecasts <ArrowRight size={12} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={MOCK_TIMESERIES}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 10, color: 'var(--text-primary)', backdropFilter: 'blur(20px)' }}
                  labelStyle={{ color: 'var(--text-muted)', fontSize: 11 }}
                />
                <Line dataKey="chilika" stroke="#10b981" strokeWidth={2} dot={false} name="Chilika Lake" />
                <Line dataKey="cauvery" stroke="#00d4c8" strokeWidth={2} dot={false} name="Cauvery River" />
                <Line dataKey="palar" stroke="#f59e0b" strokeWidth={2} dot={false} name="Palar River" />
                <Line dataKey="yamuna" stroke="#ef4444" strokeWidth={2} dot={false} name="Yamuna River" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
              {[['Chilika Lake', '#10b981'], ['Cauvery River', '#00d4c8'], ['Palar River', '#f59e0b'], ['Yamuna River', '#ef4444']].map(([name, color]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 24, height: 2, background: color, borderRadius: 1 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Active Alerts */}
          <motion.div
            className="glass"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ padding: 24, display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>Active Alerts</h3>
              <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}
                onClick={() => navigate('/app/alerts')}>
                View all
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {MOCK_ALERTS.filter(a => !a.is_acknowledged).slice(0, 5).map(alert => (
                <div key={alert.alert_id} style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  cursor: 'pointer', transition: 'border-color 0.2s ease',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-glow)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-glass)')}
                  onClick={() => navigate('/app/alerts')}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                    background: alert.severity === 'CRITICAL' ? 'var(--red-400)' : alert.severity === 'HIGH' ? 'var(--amber-400)' : 'var(--cyan-300)',
                    boxShadow: alert.severity === 'CRITICAL' ? '0 0 6px rgba(239,68,68,0.6)' : alert.severity === 'HIGH' ? '0 0 6px rgba(245,158,11,0.6)' : '0 0 6px rgba(0,212,200,0.5)',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {alert.common_name ? `${alert.common_name} — ${alert.alert_type.replace('_', ' ')}` : alert.alert_type.replace('_', ' ')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {alert.site_name} · {alert.severity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Second row: Sites + Recent Samples */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Site Health Summary */}
          <motion.div
            className="glass"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{ padding: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>Site Health Overview</h3>
              <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}
                onClick={() => navigate('/app/map')}>
                Open Map <ExternalLink size={11} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MOCK_SITES.slice(0, 6).map(site => (
                <div key={site.site_id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-glow)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-glass)')}
                  onClick={() => navigate('/app/map')}
                >
                  {/* Health dot */}
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: HEALTH_COLOR[site.health_classification] }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>{site.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{site.state} · {site.species_detected} species</div>
                  </div>
                  {/* Score bar */}
                  <div style={{ width: 80 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: HEALTH_COLOR[site.health_classification] }}>
                        {site.latest_health_score}
                      </span>
                      {site.active_alerts > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--red-400)' }}>⚠ {site.active_alerts}</span>
                      )}
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: 'var(--bg-void)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        width: `${site.latest_health_score}%`,
                        background: HEALTH_COLOR[site.health_classification],
                        transition: 'width 1s ease',
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Samples */}
          <motion.div
            className="glass"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ padding: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>Recent Samples</h3>
              <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}
                onClick={() => navigate('/app/samples')}>
                All samples
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MOCK_SAMPLES.map(sample => (
                <div key={sample.sample_id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                  cursor: 'pointer', transition: 'border-color 0.2s ease',
                }}
                  onClick={() => navigate(`/app/samples/${sample.sample_id}`)}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-glow)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-glass)')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan-300)', fontWeight: 600 }}>
                        {sample.sample_id}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sample.location_name}
                    </div>
                  </div>
                  {/* Status pill */}
                  <span style={{
                    padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: STATUS_COLOR[sample.status],
                    background: `${STATUS_COLOR[sample.status]}18`,
                    border: `1px solid ${STATUS_COLOR[sample.status]}35`,
                    flexShrink: 0,
                  }}>
                    {sample.status}
                  </span>
                  {/* Progress */}
                  {sample.status === 'processing' && (
                    <div style={{ width: 48, height: 3, borderRadius: 2, background: 'var(--bg-void)', overflow: 'hidden' }}>
                      <div style={{ width: `${sample.progress_pct}%`, height: '100%', background: 'var(--cyan-400)', borderRadius: 2 }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scientific disclaimer */}
        <div style={{
          marginTop: 20, padding: '12px 18px', borderRadius: 10,
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <AlertTriangle size={14} color="var(--amber-400)" />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--amber-400)' }}>Scientific Disclaimer:</strong> Genova is a decision-support tool.
            AI classification results are not confirmed species identifications. All alerts require field and laboratory validation
            before regulatory action. Review all results with a qualified ecologist.
          </p>
        </div>
      </div>
    </div>
  )
}
