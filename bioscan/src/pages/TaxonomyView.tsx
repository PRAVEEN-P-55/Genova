import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ChevronRight, Info, Filter } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { MOCK_TAXONOMY } from '../mocks/data'
import type { TaxonomyResult } from '../types'

const KINGDOM_FILTERS = ['All', 'Animalia', 'Plantae', 'Fungi', 'Bacteria', 'Archaea']
const STATUS_FILTERS = ['All', 'CLASSIFIED', 'UNCLASSIFIED', 'NOVEL_CANDIDATE']

function ConfidenceGauge({ value, size = 52 }: { value: number; size?: number }) {
  const radius = (size / 2) - 6
  const circumference = 2 * Math.PI * radius
  const color = value >= 0.8 ? 'var(--green-400)' : value >= 0.5 ? 'var(--cyan-400)' : 'var(--amber-400)'
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--bg-void)" strokeWidth={4} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={4}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${value * circumference} ${circumference}` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color, fontFamily: 'var(--font-mono)',
      }}>
        {Math.round(value * 100)}
      </div>
    </div>
  )
}

function TaxonomyHierarchy({ taxonomy }: { taxonomy: TaxonomyResult['taxonomy'] }) {
  if (!taxonomy) return null
  const levels = [taxonomy.kingdom, taxonomy.phylum, taxonomy.class, taxonomy.order, taxonomy.family, taxonomy.genus, `${taxonomy.genus} ${taxonomy.species}`]
  const labels = ['Kingdom', 'Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species']

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
      {levels.map((level, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            fontSize: 10, color: i === levels.length - 1 ? 'var(--cyan-300)' : 'var(--text-muted)',
            fontStyle: i === levels.length - 1 ? 'italic' : 'normal',
            fontWeight: i === levels.length - 1 ? 600 : 400,
          }} title={labels[i]}>
            {level}
          </span>
          {i < levels.length - 1 && <ChevronRight size={9} color="var(--text-dim)" />}
        </span>
      ))}
    </div>
  )
}

function XAIDrawer({ result, onClose }: { result: TaxonomyResult; onClose: () => void }) {
  const ensemble = result.ensemble
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, zIndex: 50,
        background: 'rgba(6,14,28,0.97)', backdropFilter: 'blur(24px)',
        borderLeft: '1px solid var(--border-glass)', overflowY: 'auto',
      }}
    >
      <div style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>Explainable AI Panel</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>×</button>
        </div>

        {/* Species */}
        <div style={{ padding: 16, borderRadius: 10, background: 'rgba(0,212,200,0.06)', border: '1px solid rgba(0,212,200,0.15)', marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Classification</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontStyle: 'italic' }}>
            {result.taxonomy ? `${result.taxonomy.genus} ${result.taxonomy.species}` : 'Unclassified'}
          </div>
          {result.taxonomy && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{result.taxonomy.common_name}</div>}
        </div>

        {/* Ensemble Model Scores */}
        {ensemble && (
          <div style={{ marginBottom: 24 }}>
            <div className="text-label" style={{ marginBottom: 12 }}>Ensemble Model Evidence</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-around', padding: '16px', borderRadius: 10, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
              {[
                { label: 'k-mer', value: ensemble.kmer_model, color: '#7c3aed' },
                { label: 'DNABERT', value: ensemble.dnabert_model, color: '#00d4c8' },
                { label: 'BLAST', value: ensemble.blast_identity, color: '#10b981' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <ConfidenceGauge value={value} />
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-glass)' }}>
              <span className="text-label">Ensemble Agreement: </span>
              <span style={{
                fontWeight: 700, color: ensemble.agreement === 'HIGH' ? 'var(--green-400)' : ensemble.agreement === 'MEDIUM' ? 'var(--amber-400)' : 'var(--red-400)'
              }}>
                {ensemble.agreement}
              </span>
            </div>
          </div>
        )}

        {/* Attention weights heatmap */}
        <div style={{ marginBottom: 24 }}>
          <div className="text-label" style={{ marginBottom: 12 }}>Sequence Attention Weights</div>
          <div style={{ padding: 16, borderRadius: 10, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
            {[
              { start: 45, end: 120, label: 'COI conserved region', weight: 0.82, color: 'rgba(0,212,200,' },
              { start: 220, end: 290, label: 'Species-specific variable region', weight: 0.91, color: 'rgba(16,185,129,' },
            ].map((region, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{region.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan-300)' }}>{Math.round(region.weight * 100)}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-void)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${region.weight * 100}%` }}
                    transition={{ duration: 0.7, delay: i * 0.15 }}
                    style={{ height: '100%', background: `${region.color}0.7)`, borderRadius: 3, boxShadow: `0 0 8px ${region.color}0.4)` }}
                  />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                  bp {region.start}–{region.end}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BLAST evidence */}
        <div style={{ marginBottom: 24 }}>
          <div className="text-label" style={{ marginBottom: 12 }}>BLAST Reference Match</div>
          <div style={{ padding: 16, borderRadius: 10, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', fontSize: 12, lineHeight: 1.8, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            <div>Accession: <span style={{ color: 'var(--cyan-300)' }}>KM396246</span></div>
            <div>E-value: <span style={{ color: 'var(--green-400)' }}>0.0</span></div>
            <div>Identity: <span style={{ color: 'var(--green-400)' }}>{ensemble ? (ensemble.blast_identity * 100).toFixed(1) : 'N/A'}%</span></div>
            <div>Database: <span style={{ color: 'var(--text-primary)' }}>BOLD Systems v5</span></div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ padding: 12, borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <AlertTriangle size={13} color="var(--amber-400)" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            XAI evidence is provided for transparency. Classification confidence is not equivalent to confirmed species presence. Field validation required.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default function TaxonomyView() {
  const [kingdomFilter, setKingdomFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [minConfidence, setMinConfidence] = useState(0)
  const [selectedResult, setSelectedResult] = useState<TaxonomyResult | null>(null)

  const filtered = MOCK_TAXONOMY.filter(r => {
    if (kingdomFilter !== 'All' && r.taxonomy?.kingdom !== kingdomFilter) return false
    if (statusFilter !== 'All' && r.classification_status !== statusFilter) return false
    if (r.confidence < minConfidence / 100) return false
    return true
  })

  const classified = filtered.filter(r => r.classification_status === 'CLASSIFIED').length

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar title="Taxonomy Results" subtitle="EDNA-IND-00142 · Palar River, Tamil Nadu" />

      <div className="content-area" style={{ padding: 24 }}>
        {/* Summary row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[
            { value: String(MOCK_TAXONOMY.length), label: 'Total Sequences', color: 'var(--cyan-300)' },
            { value: String(classified), label: 'Classified', color: 'var(--green-400)' },
            { value: String(MOCK_TAXONOMY.filter(r => r.is_invasive).length), label: 'Invasive', color: 'var(--red-400)' },
            { value: String(MOCK_TAXONOMY.filter(r => r.wpa_schedule).length), label: 'WPA Listed', color: 'var(--amber-400)' },
          ].map(({ value, label, color }) => (
            <div key={label} className="glass" style={{ flex: 1, padding: '16px 20px' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: '-0.03em' }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="glass" style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={14} color="var(--text-muted)" />
          <div style={{ display: 'flex', gap: 6 }}>
            {KINGDOM_FILTERS.map(k => (
              <button key={k} onClick={() => setKingdomFilter(k)} style={{
                padding: '4px 12px', borderRadius: 100, fontSize: 12, cursor: 'pointer',
                background: kingdomFilter === k ? 'rgba(0,212,200,0.15)' : 'var(--bg-glass)',
                color: kingdomFilter === k ? 'var(--cyan-300)' : 'var(--text-muted)',
                border: `1px solid ${kingdomFilter === k ? 'var(--cyan-400)' : 'var(--border-glass)'}`,
                transition: 'all 0.2s ease',
              }}>
                {k}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Min confidence: {minConfidence}%</span>
            <input type="range" min={0} max={90} value={minConfidence} onChange={e => setMinConfidence(Number(e.target.value))} style={{ accentColor: 'var(--cyan-400)' }} />
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(result => (
            <motion.div
              key={result.result_id}
              className="glass"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
              onClick={() => result.classification_status === 'CLASSIFIED' && setSelectedResult(result)}
            >
              {/* Confidence gauge */}
              <ConfidenceGauge value={result.confidence} />

              {/* Main info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {result.classification_status === 'CLASSIFIED' && result.taxonomy ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', fontStyle: 'italic' }}>
                        {result.taxonomy.genus} {result.taxonomy.species}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>— {result.taxonomy.common_name}</span>
                    </div>
                    <TaxonomyHierarchy taxonomy={result.taxonomy} />
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <span className="badge badge-cyan">{result.barcode_marker}</span>
                      <span className={`badge badge-${result.conservation_status === 'Least Concern' ? 'LC' : result.conservation_status === 'Near Threatened' ? 'NT' : result.conservation_status === 'Vulnerable' ? 'VU' : 'LC'}`}>
                        {result.conservation_status ?? 'LC'}
                      </span>
                      {result.is_invasive && <span className="badge badge-invasive">⚠ INVASIVE</span>}
                      {result.wpa_schedule && <span className="badge badge-wpa">{result.wpa_schedule}</span>}
                    </div>
                  </>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-muted)' }}>
                        ⟡ Potential Novel / Unclassified Taxon
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--red-400)', marginBottom: 4 }}>
                      Validation required before any taxonomic claim
                    </div>
                    {result.nearest_match && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Nearest: {result.nearest_match.taxon} ({(result.nearest_match.similarity * 100).toFixed(0)}% similarity)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Abundance */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Reads</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {result.read_count ?? '—'}
                </div>
                {result.classification_status === 'CLASSIFIED' && (
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 11 }}>
                    <Info size={10} />
                    View XAI
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scientific disclaimer */}
        <div style={{ marginTop: 20, padding: '12px 18px', borderRadius: 10, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertTriangle size={14} color="var(--amber-400)" />
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            AI classification results ≠ confirmed species identification. Confidence scores indicate model agreement, not ecological certainty. All results require expert review.
          </p>
        </div>
      </div>

      {/* XAI Drawer */}
      <AnimatePresence>
        {selectedResult && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(3,10,18,0.5)', zIndex: 49 }}
              onClick={() => setSelectedResult(null)}
            />
            <XAIDrawer result={selectedResult} onClose={() => setSelectedResult(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
