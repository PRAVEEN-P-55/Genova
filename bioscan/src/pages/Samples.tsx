import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, Upload, Eye } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { MOCK_SAMPLES } from '../mocks/data'
import type { Sample } from '../types'

const STATUS_COLORS: Record<string, string> = {
  completed: 'var(--green-400)',
  processing: 'var(--cyan-300)',
  classifying: 'var(--violet-300)',
  queued: 'var(--text-muted)',
  failed: 'var(--red-400)',
}

function SampleRow({ sample }: { sample: Sample }) {
  const navigate = useNavigate()
  const color = STATUS_COLORS[sample.status] ?? STATUS_COLORS.queued

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="glass"
      style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
      onClick={() => navigate(`/app/taxonomy/${sample.sample_id}`)}
    >
      {/* Status dot */}
      <div style={{
        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
        background: color,
        boxShadow: `0 0 ${sample.status === 'processing' ? '10px' : '6px'} ${color}80`,
        animation: sample.status === 'processing' ? 'pulse-glow 1.5s ease infinite' : 'none',
      }} />

      {/* Sample ID */}
      <div style={{ minWidth: 160 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--cyan-300)' }}>
          {sample.sample_id}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {new Date(sample.collection_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Location */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sample.location_name}
        </div>
        {sample.water_temp_c && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {sample.water_temp_c}°C · pH {sample.ph} · DO {sample.dissolved_oxygen} mg/L
          </div>
        )}
      </div>

      {/* QC badge */}
      {sample.qc_summary && (
        <div style={{ textAlign: 'center', minWidth: 80 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>QC Score</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: sample.qc_summary.status === 'PASS' ? 'var(--green-400)' : 'var(--amber-400)', fontFamily: 'var(--font-mono)' }}>
            {sample.qc_summary.reliability_score}
          </div>
        </div>
      )}

      {/* Results summary */}
      {sample.analysis_summary && (
        <div style={{ display: 'flex', gap: 16, minWidth: 200 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Taxa</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{sample.analysis_summary.taxa_detected}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Health</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cyan-300)', fontFamily: 'var(--font-mono)' }}>{sample.analysis_summary.ecosystem_health_score}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Alerts</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: sample.analysis_summary.alerts > 0 ? 'var(--red-400)' : 'var(--green-400)', fontFamily: 'var(--font-mono)' }}>
              {sample.analysis_summary.alerts}
            </div>
          </div>
        </div>
      )}

      {/* Progress (for in-progress) */}
      {sample.status === 'processing' && (
        <div style={{ minWidth: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sample.current_stage}</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--cyan-300)' }}>{sample.progress_pct}%</span>
          </div>
          <div style={{ height: 3, borderRadius: 2, background: 'var(--bg-void)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${sample.progress_pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ height: '100%', background: 'var(--cyan-400)', borderRadius: 2 }}
            />
          </div>
        </div>
      )}

      {/* Status chip */}
      <span style={{
        padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
        color, background: `${color}10`, border: `1px solid ${color}30`, flexShrink: 0,
      }}>
        {sample.status}
      </span>

      {/* View CTA */}
      {sample.status === 'completed' && (
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          <Eye size={14} /> View
        </button>
      )}
    </motion.div>
  )
}

export default function Samples() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = MOCK_SAMPLES.filter(s => {
    if (search && !s.sample_id.toLowerCase().includes(search.toLowerCase()) && !s.location_name.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    return true
  })

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar title="eDNA Samples" subtitle="All samples across monitored sites" />

      <div className="content-area" style={{ padding: 24 }}>
        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 320, padding: '8px 14px', borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search samples or locations..."
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, flex: 1, fontFamily: 'var(--font-sans)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <Filter size={14} color="var(--text-muted)" style={{ marginTop: 10 }} />
            {['all', 'completed', 'processing', 'queued'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '7px 14px', borderRadius: 100, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
                background: statusFilter === s ? 'rgba(0,212,200,0.12)' : 'var(--bg-glass)',
                color: statusFilter === s ? 'var(--cyan-300)' : 'var(--text-muted)',
                border: `1px solid ${statusFilter === s ? 'var(--cyan-400)' : 'var(--border-glass)'}`,
                transition: 'all 0.2s ease',
              }}>
                {s}
              </button>
            ))}
          </div>

          <button className="btn btn-primary" style={{ marginLeft: 'auto', padding: '9px 20px', fontSize: 13 }} onClick={() => navigate('/app/upload')}>
            <Upload size={14} /> New Sample
          </button>
        </div>

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(sample => <SampleRow key={sample.sample_id} sample={sample} />)}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No samples match your filter.</div>
          )}
        </div>
      </div>
    </div>
  )
}
