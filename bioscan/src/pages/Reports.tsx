import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { reportsApi } from '../services/api'

const REPORT_TEMPLATES = [
  {
    id: 'NBSAP',
    title: 'NBSAP Compliance Report',
    description: 'National Biodiversity Strategy and Action Plan summary for this monitoring period',
    format: 'PDF',
    color: 'var(--cyan-300)',
    icon: '🇮🇳',
    sections: ['Site Summary', 'Biodiversity Indices', 'Conservation Status', 'Threat Assessment', 'Regulatory Compliance'],
  },
  {
    id: 'WPA',
    title: 'WPA Schedule I–IV Alert Report',
    description: 'Wildlife Protection Act scheduled species detection summary for forest authorities',
    format: 'PDF',
    color: 'var(--amber-400)',
    icon: '🛡️',
    sections: ['Schedule I Detections', 'Schedule II Detections', 'Recommended Actions', 'Chain of Evidence'],
  },
  {
    id: 'IUCN',
    title: 'IUCN Red List Status Report',
    description: 'Summary of IUCN-listed species detected across all monitoring sites',
    format: 'PDF',
    color: 'var(--red-400)',
    icon: '🔴',
    sections: ['Critically Endangered', 'Endangered', 'Vulnerable', 'Near Threatened', 'Trend Analysis'],
  },
  {
    id: 'RESEARCH',
    title: 'Research Data Export',
    description: 'Full machine-readable export of all taxonomic results and biodiversity metrics',
    format: 'JSON / CSV',
    color: 'var(--violet-300)',
    icon: '📊',
    sections: ['Raw Taxonomy Data', 'Biodiversity Indices', 'FASTA Sequences', 'Metadata'],
  },
  {
    id: 'FIELD',
    title: 'Field Verification Checklist',
    description: 'Priority species list for manual field verification of AI detections',
    format: 'PDF',
    color: 'var(--green-400)',
    icon: '🔬',
    sections: ['High-Priority Species', 'Verification Protocol', 'GPS Coordinates', 'Observation Form'],
  },
]

const AUDIT_LOG = [
  { id: 'RPT-2025-0842', title: 'NBSAP Q2 2025 Report', date: '2025-07-01', user: 'Dr. Meena Srinivasan', status: 'generated' },
  { id: 'RPT-2025-0791', title: 'WPA Alert Report — Palar River', date: '2025-08-10', user: 'Pravin Kumar', status: 'generated' },
  { id: 'RPT-2025-0744', title: 'Research Export — June 2025', date: '2025-06-30', user: 'Pravin Kumar', status: 'generated' },
]

export default function Reports() {
  const [generating, setGenerating] = useState<string | null>(null)
  const [generated, setGenerated] = useState<Set<string>>(new Set())
  const [auditLogs, setAuditLogs] = useState<any[]>(AUDIT_LOG)

  useEffect(() => {
    reportsApi.getAll().then((data) => {
      if (data && data.length > 0) {
        setAuditLogs(data.map((r: any) => ({
          id: r.report_id,
          title: r.title,
          date: r.created_at?.split(' ')[0] || r.created_at,
          user: r.generated_by,
          status: 'generated'
        })))
      }
    }).catch(e => console.warn('[Reports] Live fetch fallback:', e))
  }, [])

  const generate = async (id: string, title?: string) => {
    setGenerating(id)
    try {
      const created = await reportsApi.generate({
        title: title || `${id} Official Survey & Compliance Audit`,
        report_type: id,
        site_id: 'site-sundarbans',
        sample_id: 'EDNA-IND-00142'
      })
      if (created) {
        setAuditLogs(prev => [{
          id: created.report_id,
          title: created.title,
          date: new Date().toISOString().split('T')[0],
          user: created.generated_by,
          status: 'generated'
        }, ...prev])
      }
    } catch (e) {
      console.warn('[Reports] Generate fallback:', e)
    }
    await new Promise(r => setTimeout(r, 1200))
    setGenerating(null)
    setGenerated(prev => new Set([...prev, id]))
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar title="Reports & Exports" subtitle="NBSAP, WPA, IUCN compliance reporting · Audit trail" />

      <div className="content-area" style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          {/* Templates */}
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontWeight: 600, fontSize: 18, color: 'var(--text-primary)', marginBottom: 4 }}>Report Templates</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Generate standardised compliance and research reports from your platform data</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {REPORT_TEMPLATES.map((template, i) => (
                <motion.div
                  key={template.id}
                  className="glass"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}
                >
                  <div style={{ fontSize: 32, flexShrink: 0 }}>{template.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <h3 style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{template.title}</h3>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', color: template.color, background: `${template.color}10`, border: `1px solid ${template.color}30` }}>
                        {template.format}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>{template.description}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {template.sections.map(section => (
                        <span key={section} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                          {section}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                    <button
                      className={generated.has(template.id) ? 'btn btn-ghost' : 'btn btn-primary'}
                      style={{ padding: '9px 18px', fontSize: 13 }}
                      onClick={() => !generated.has(template.id) && generate(template.id)}
                      disabled={generating === template.id}
                    >
                      {generating === template.id ? (
                        <>
                          <div style={{ width: 14, height: 14, border: '2px solid rgba(3,10,18,0.3)', borderTopColor: '#030a12', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} />
                          Generating...
                        </>
                      ) : generated.has(template.id) ? (
                        <><Download size={13} /> Download</>
                      ) : (
                        <><FileText size={13} /> Generate</>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Disclaimer */}
            <div style={{ marginTop: 20, padding: '14px 18px', borderRadius: 10, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertTriangle size={14} color="var(--amber-400)" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Regulatory Use Warning</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  All AI-generated reports contain preliminary findings based on eDNA analysis. Reports are suitable for internal review and scientific investigation.
                  Before submitting to regulatory authorities (MoEFCC, State Forest Departments, CPCB), all species detections must be verified through
                  independent field surveys and laboratory analysis. Genova is not a substitute for qualified ecological assessment.
                </p>
              </div>
            </div>
          </div>

          {/* Audit log */}
          <div>
            <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 16 }}>Recent Report Audit Log</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {auditLogs.map(entry => (
                  <div key={entry.id} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--cyan-300)' }}>{entry.id}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--green-400)' }}>
                        <CheckCircle size={10} /> Generated
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{entry.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {entry.date} · {entry.user}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data provenance note */}
            <div className="glass" style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <Clock size={14} color="var(--cyan-300)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Data Provenance</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                All reports include a full audit trail: sample IDs, QC scores, AI model versions, reference database versions, and processing timestamps.
              </p>
              <div style={{ marginTop: 12, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', lineHeight: 2 }}>
                <div>Model: k-mer v2.1 + DNABERT-2 + XGBoost</div>
                <div>Reference: BOLD Systems v5 · SILVA v138 · UNITE v9</div>
                <div>Ecosystem Health: Methodology v1.2</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
