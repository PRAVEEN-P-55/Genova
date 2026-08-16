import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid
} from 'recharts'
import { AlertTriangle } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { MOCK_BIODIVERSITY } from '../mocks/data'

const HEALTH_COLORS: Record<string, string> = {
  HEALTHY: 'var(--green-400)',
  MODERATE: 'var(--amber-400)',
  DEGRADED: '#f97316',
  CRITICAL: 'var(--red-400)',
}

function HealthScoreRing({ score, classification, color }: { score: number; classification: string; color: string }) {
  const size = 200
  const radius = 80
  const circumference = 2 * Math.PI * radius
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--bg-void)" strokeWidth={14} />
          <motion.circle
            cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={14}
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${(score/100) * circumference} ${circumference}` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ fontSize: 42, fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1 }}
          >
            {score}
          </motion.span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/100</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {classification}
        </span>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Ecosystem Health Score</div>
      </div>
    </div>
  )
}

function IndexGauge({ label, value, max, unit, description }: { label: string; value: number; max: number; unit?: string; description: string }) {
  const pct = Math.min(value / max, 1)
  const color = pct >= 0.7 ? 'var(--green-400)' : pct >= 0.4 ? 'var(--cyan-400)' : 'var(--amber-400)'
  return (
    <div className="glass" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div className="text-label" style={{ marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: '-0.02em' }}>
            {value.toFixed(2)}{unit}
          </div>
        </div>
        <div style={{ width: 48, height: 48, position: 'relative' }}>
          <svg width={48} height={48} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={24} cy={24} r={18} fill="none" stroke="var(--bg-void)" strokeWidth={5} />
            <motion.circle
              cx={24} cy={24} r={18} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${2*Math.PI*18}` }}
              animate={{ strokeDasharray: `${pct * 2 * Math.PI * 18} ${2*Math.PI*18}` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
        </div>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>{description}</p>
    </div>
  )
}

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ padding: '10px 14px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 8, backdropFilter: 'blur(20px)' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ fontSize: 13, fontWeight: 600, color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function BiodiversityDashboard() {
  const { alpha_diversity, ecosystem_health, benchmark, taxonomic_breakdown, conservation_breakdown } = MOCK_BIODIVERSITY
  const [showComponents, setShowComponents] = useState(false)

  const color = HEALTH_COLORS[ecosystem_health.classification]

  const benchmarkData = [
    { name: 'Health Score', site: ecosystem_health.score, state: benchmark.state_average.health_score, national: benchmark.national_average.health_score },
    { name: 'Species Richness', site: alpha_diversity.species_richness, state: benchmark.state_average.species_richness, national: benchmark.national_average.species_richness },
    { name: 'Shannon Index', site: +(alpha_diversity.shannon_index * 25).toFixed(1), state: 89, national: 82 },
  ]

  const taxoData = [
    { name: 'Fish', value: taxonomic_breakdown.fish, color: '#00d4c8' },
    { name: 'Plant', value: taxonomic_breakdown.plant, color: '#10b981' },
    { name: 'Microbial', value: taxonomic_breakdown.microbial, color: '#7c3aed' },
    { name: 'Fungal', value: taxonomic_breakdown.fungal, color: '#f59e0b' },
    { name: 'Amphibian', value: taxonomic_breakdown.amphibian, color: '#60a5fa' },
    { name: 'Other', value: taxonomic_breakdown.other, color: '#64748b' },
    { name: 'Unclassified', value: taxonomic_breakdown.unclassified, color: '#334155' },
  ]

  const conservationData = [
    { name: 'LC', value: conservation_breakdown.LC, color: '#10b981' },
    { name: 'NT', value: conservation_breakdown.NT, color: '#a3e635' },
    { name: 'VU', value: conservation_breakdown.VU, color: '#f59e0b' },
    { name: 'EN', value: conservation_breakdown.EN, color: '#f97316' },
    { name: 'CR', value: conservation_breakdown.CR, color: '#ef4444' },
  ]

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar title="Biodiversity Analysis" subtitle="EDNA-IND-00142 · Palar River, Tamil Nadu" />

      <div className="content-area" style={{ padding: 24 }}>
        {/* Top row: Health score + Alpha indices */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, marginBottom: 20 }}>
          {/* Health Score Ring */}
          <motion.div
            className="glass"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
          >
            <HealthScoreRing score={ecosystem_health.score} classification={ecosystem_health.classification} color={color} />
            <button
              onClick={() => setShowComponents(!showComponents)}
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center', padding: '8px 16px', fontSize: 12 }}
            >
              {showComponents ? 'Hide' : 'Show'} Component Breakdown
            </button>
            {showComponents && (
              <div style={{ width: '100%', fontSize: 11 }}>
                {Object.entries(ecosystem_health.components).map(([key, comp]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-glass)' }}>
                    <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                    <span style={{ fontWeight: 600, color: comp.weighted < 0 ? 'var(--red-400)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {comp.weighted > 0 ? '+' : ''}{comp.weighted.toFixed(1)}
                    </span>
                  </div>
                ))}
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                  Methodology v{ecosystem_health.methodology_version} · Confidence {(ecosystem_health.confidence * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </motion.div>

          {/* Alpha diversity indices */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <IndexGauge label="Shannon Index (H')" value={alpha_diversity.shannon_index} max={5} description="Measures species diversity accounting for both richness and evenness" />
            <IndexGauge label="Simpson Index (D)" value={alpha_diversity.simpson_index} max={1} description="Probability that two randomly selected individuals belong to different species" />
            <IndexGauge label="Chao1 Estimate" value={alpha_diversity.chao1_richness_estimate} max={200} description="Non-parametric estimate of total species richness including undetected species" />
            <IndexGauge label="Pielou's Evenness (J')" value={alpha_diversity.pielou_evenness} max={1} description="How evenly individuals are distributed among the detected species" />
          </div>
        </div>

        {/* Second row: Benchmark + Taxon breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Benchmark comparison */}
          <motion.div className="glass" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>Benchmark Comparison</h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>{benchmark.comparison}</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={benchmarkData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Bar dataKey="site" name="This Site" fill="#00d4c8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="state" name={`${MOCK_BIODIVERSITY.site.split(',')[1]?.trim()} Avg`} fill="rgba(124,58,237,0.5)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="national" name="National Avg" fill="rgba(100,116,139,0.4)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Taxonomic breakdown */}
          <motion.div className="glass" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 16 }}>Taxonomic Breakdown</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={taxoData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
                  {taxoData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CUSTOM_TOOLTIP />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 8 }}>
              {taxoData.map(({ name, value, color: c }) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: c, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{name} ({value})</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Conservation status */}
          <motion.div className="glass" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 16 }}>Conservation Status</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={conservationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {conservationData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>LC=Least Concern · NT=Near Threatened · VU=Vulnerable · EN=Endangered · CR=Critically Endangered</div>
          </motion.div>
        </div>

        <div style={{ padding: '12px 18px', borderRadius: 10, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertTriangle size={14} color="var(--amber-400)" />
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Biodiversity metrics are computed from eDNA signal detection. Species estimates carry uncertainty from sequencing depth, primer bias, and reference database coverage.
          </p>
        </div>
      </div>
    </div>
  )
}
