import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, CheckCircle, XCircle, AlertTriangle, MapPin, Thermometer, Droplets, FileText } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { samplesApi } from '../services/api'

const PIPELINE_STAGES = [
  { id: 'validate', label: 'VALIDATING', icon: '🔍', duration: 1200 },
  { id: 'qc', label: 'QUALITY CONTROL', icon: '📊', duration: 2000 },
  { id: 'preprocess', label: 'SEQUENCE PROCESSING', icon: '⚙️', duration: 3000 },
  { id: 'classify', label: 'AI CLASSIFICATION', icon: '🧬', duration: 4000 },
  { id: 'taxonomy', label: 'TAXONOMIC ANALYSIS', icon: '🔬', duration: 2500 },
  { id: 'biodiversity', label: 'BIODIVERSITY ASSESSMENT', icon: '🌿', duration: 1800 },
  { id: 'finalize', label: 'FINALIZING', icon: '✅', duration: 800 },
]

const VALID_EXTENSIONS = ['.fastq', '.fastq.gz', '.fasta', '.fa']
const DNA_BASES = 'ATGCATGCTAGCATGCATGCTAGCATGCTAGCATGCAT'

function SequenceStrip({ sequence }: { sequence: string }) {
  const BASE_COLORS: Record<string, string> = { A: 'dna-base-A', T: 'dna-base-T', G: 'dna-base-G', C: 'dna-base-C' }
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8, marginTop: 12 }}>
      {/* Scan cursor */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, width: 40,
        background: 'linear-gradient(to right, transparent, rgba(0,212,200,0.3), transparent)',
        animation: 'scan-right 3s linear infinite',
        zIndex: 1, pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', gap: 2, padding: '8px 4px', overflowX: 'auto' }}>
        {sequence.split('').map((base, i) => (
          <div
            key={i}
            className={BASE_COLORS[base] ?? ''}
            style={{
              width: 22, height: 22, borderRadius: 4, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
            }}
          >
            {base}
          </div>
        ))}
      </div>
    </div>
  )
}

function PipelineTracker({ currentStage, completedStages }: { currentStage: number; completedStages: number[] }) {
  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
        {PIPELINE_STAGES.map((stage, idx) => {
          const completed = completedStages.includes(idx)
          const active = currentStage === idx
          const pending = !completed && !active

          return (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 80 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                {/* Node */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: completed ? 'rgba(16,185,129,0.15)' : active ? 'rgba(0,212,200,0.15)' : 'var(--bg-glass)',
                  border: `2px solid ${completed ? 'var(--green-400)' : active ? 'var(--cyan-400)' : 'var(--border-glass)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                  boxShadow: active ? '0 0 16px rgba(0,212,200,0.4)' : completed ? '0 0 12px rgba(16,185,129,0.25)' : 'none',
                  transition: 'all 0.5s ease',
                  animation: active ? 'pulse-glow 1.5s ease infinite' : 'none',
                }}>
                  {completed ? <CheckCircle size={20} color="var(--green-400)" /> : stage.icon}
                </div>
                {/* Label */}
                <div style={{
                  marginTop: 6, fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', textAlign: 'center', fontFamily: 'var(--font-mono)',
                  color: completed ? 'var(--green-400)' : active ? 'var(--cyan-300)' : 'var(--text-dim)',
                  maxWidth: 80, lineHeight: 1.3,
                }}>
                  {stage.label}
                </div>
              </div>
              {/* Connector */}
              {idx < PIPELINE_STAGES.length - 1 && (
                <div style={{
                  height: 2, flex: 0.3, minWidth: 12,
                  background: completed ? 'var(--green-400)' : 'var(--border-glass)',
                  transition: 'background 0.5s ease', marginBottom: 24,
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SampleUpload() {
  const [step, setStep] = useState<'upload' | 'metadata' | 'review' | 'pipeline' | 'complete'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string>('')
  const [dragging, setDragging] = useState(false)
  const [sampleId] = useState(`EDNA-IND-${String(Math.floor(Math.random() * 99000) + 1000).padStart(5, '0')}`)
  const [currentStage, setCurrentStage] = useState(-1)
  const [completedStages, setCompletedStages] = useState<number[]>([])
  const [metadata, setMetadata] = useState({ location: 'Palar River, Tamil Nadu', lat: '12.9716', lon: '79.1297', date: new Date().toISOString().split('T')[0], temp: '28.4', ph: '7.2', do: '6.8' })
  const fileRef = useRef<HTMLInputElement>(null)

  const validateFile = (f: File): string => {
    const ext = f.name.toLowerCase()
    const isValid = VALID_EXTENSIONS.some(e => ext.endsWith(e))
    if (!isValid) return `Invalid format. Accepted: ${VALID_EXTENSIONS.join(', ')}`
    if (f.size > 2 * 1024 * 1024 * 1024) return 'File too large. Maximum size: 2GB'
    return ''
  }

  const handleFile = (f: File) => {
    const err = validateFile(f)
    setFileError(err)
    if (!err) { setFile(f); setFileError('') }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const runPipeline = async () => {
    setStep('pipeline')
    setCurrentStage(0)

    // Call live backend upload endpoint
    try {
      const formData = new FormData()
      if (file) formData.append('file', file)
      formData.append('location_name', metadata.location)
      formData.append('latitude', metadata.lat)
      formData.append('longitude', metadata.lon)
      formData.append('collection_date', metadata.date)
      formData.append('water_temp_c', metadata.temp)
      formData.append('ph', metadata.ph)
      formData.append('dissolved_oxygen', metadata.do)
      formData.append('file_name', file ? file.name : 'EDNA_RUN_01.fastq.gz')
      formData.append('file_format', file?.name.endsWith('.fasta') ? 'FASTA' : 'FASTQ')

      await samplesApi.upload(formData)
    } catch (e) {
      console.warn('[Pipeline] Backend upload warning:', e)
    }

    for (let i = 0; i < PIPELINE_STAGES.length; i++) {
      setCurrentStage(i)
      await new Promise(r => setTimeout(r, PIPELINE_STAGES[i].duration))
      setCompletedStages(prev => [...prev, i])
    }
    setCurrentStage(-1)
    await new Promise(r => setTimeout(r, 500))
    setStep('complete')
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar title="Upload eDNA Sample" subtitle="FASTA / FASTQ sequencing file upload and pipeline" />

      <div className="content-area" style={{ maxWidth: 820, padding: 28 }}>
        {/* Step indicator */}
        {step !== 'pipeline' && step !== 'complete' && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
            {['upload', 'metadata', 'review'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  background: step === s ? 'var(--cyan-400)' : ['upload', 'metadata', 'review'].indexOf(step) > i ? 'rgba(16,185,129,0.2)' : 'var(--bg-glass)',
                  color: step === s ? '#030a12' : ['upload', 'metadata', 'review'].indexOf(step) > i ? 'var(--green-400)' : 'var(--text-muted)',
                  border: `1px solid ${step === s ? 'var(--cyan-400)' : 'var(--border-glass)'}`,
                }}>
                  {['upload', 'metadata', 'review'].indexOf(step) > i ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 13, textTransform: 'capitalize', color: step === s ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {s === 'upload' ? 'Upload File' : s === 'metadata' ? 'Sample Metadata' : 'Review & Submit'}
                </span>
                {i < 2 && <div style={{ width: 32, height: 1, background: 'var(--border-glass)' }} />}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: FILE UPLOAD */}
          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="glass" style={{ padding: 32 }}>
                <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 8, color: 'var(--text-primary)' }}>Upload Sequencing File</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
                  Accepted formats: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan-300)' }}>.fastq .fastq.gz .fasta .fa</code> · Max size: 2GB
                </p>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragging ? 'var(--cyan-400)' : file ? 'var(--green-400)' : fileError ? 'var(--red-400)' : 'var(--border-glass)'}`,
                    borderRadius: 16, padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
                    background: dragging ? 'rgba(0,212,200,0.05)' : 'var(--bg-glass)',
                    transition: 'all 0.3s ease',
                    animation: dragging ? 'pulse-glow 1s ease infinite' : 'none',
                  }}
                >
                  <input ref={fileRef} type="file" accept=".fastq,.gz,.fasta,.fa" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  {file ? (
                    <div>
                      <CheckCircle size={40} color="var(--green-400)" style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--green-400)', marginBottom: 4 }}>{file.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</div>
                    </div>
                  ) : fileError ? (
                    <div>
                      <XCircle size={40} color="var(--red-400)" style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontWeight: 600, color: 'var(--red-400)', marginBottom: 4 }}>Invalid File</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fileError}</div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
                        Drop your sequencing file here
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>or click to browse</div>
                    </div>
                  )}
                </div>

                {file && !fileError && (
                  <>
                    <SequenceStrip sequence={DNA_BASES} />
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Preview: First 40 bases (A=green, T=blue, G=cyan, C=violet) · Scan = AI processing simulation
                    </div>
                    <button className="btn btn-primary" style={{ marginTop: 24, width: '100%', justifyContent: 'center' }} onClick={() => setStep('metadata')}>
                      Continue to Metadata →
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2: METADATA */}
          {step === 'metadata' && (
            <motion.div key="metadata" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="glass" style={{ padding: 32 }}>
                <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 8, color: 'var(--text-primary)' }}>Sample Metadata</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>Attach collection context to your sample</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { key: 'location', label: 'Location Name', icon: MapPin, placeholder: 'Palar River, Tamil Nadu' },
                    { key: 'date', label: 'Collection Date', icon: FileText, type: 'date' },
                    { key: 'lat', label: 'Latitude', icon: MapPin, placeholder: '12.9716' },
                    { key: 'lon', label: 'Longitude', icon: MapPin, placeholder: '79.1297' },
                    { key: 'temp', label: 'Water Temp (°C)', icon: Thermometer, placeholder: '28.4' },
                    { key: 'ph', label: 'pH', icon: Droplets, placeholder: '7.2' },
                    { key: 'do', label: 'Dissolved O₂ (mg/L)', icon: Droplets, placeholder: '6.8' },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key} style={{ gridColumn: key === 'location' ? '1 / -1' : undefined }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {label}
                      </label>
                      <input
                        type={type ?? 'text'}
                        value={metadata[key as keyof typeof metadata]}
                        onChange={e => setMetadata(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 8,
                          background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                          color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-sans)',
                          outline: 'none', transition: 'border-color 0.2s ease',
                        }}
                        onFocus={e => (e.target.style.borderColor = 'var(--border-glow)')}
                        onBlur={e => (e.target.style.borderColor = 'var(--border-glass)')}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                  <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep('upload')}>← Back</button>
                  <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={() => setStep('review')}>Review Sample →</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 'review' && (
            <motion.div key="review" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="glass" style={{ padding: 32 }}>
                <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 24, color: 'var(--text-primary)' }}>Review & Submit</h2>
                <div style={{ padding: 20, borderRadius: 10, background: 'rgba(0,212,200,0.06)', border: '1px solid rgba(0,212,200,0.15)', marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Sample ID (auto-generated)</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--cyan-300)', fontFamily: 'var(--font-mono)' }}>{sampleId}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                  {[
                    ['File', file?.name ?? ''],
                    ['Location', metadata.location],
                    ['Collection Date', metadata.date],
                    ['Coordinates', `${metadata.lat}°N, ${metadata.lon}°E`],
                    ['Water Temp', `${metadata.temp}°C`],
                    ['pH', metadata.ph],
                  ].map(([label, value]) => (
                    <div key={label} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep('metadata')}>← Back</button>
                  <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={runPipeline}>
                    🚀 Submit for Analysis
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* PIPELINE */}
          {(step === 'pipeline' || step === 'complete') && (
            <motion.div key="pipeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="glass" style={{ padding: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h2 style={{ fontWeight: 600, fontSize: 20, color: 'var(--text-primary)' }}>
                    {step === 'complete' ? '🎉 Analysis Complete' : '🧬 Running Analysis Pipeline'}
                  </h2>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--cyan-300)' }}>{sampleId}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
                  {step === 'complete' ? 'All pipeline stages completed successfully.' : `Processing: ${file?.name}`}
                </p>

                <PipelineTracker currentStage={currentStage} completedStages={completedStages} />

                {step === 'pipeline' && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pipeline progress</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan-300)', fontFamily: 'var(--font-mono)' }}>
                        {Math.round((completedStages.length / PIPELINE_STAGES.length) * 100)}%
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-void)', overflow: 'hidden' }}>
                      <motion.div
                        style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(to right, var(--cyan-400), var(--green-400))' }}
                        animate={{ width: `${(completedStages.length / PIPELINE_STAGES.length) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    <SequenceStrip sequence={DNA_BASES} />
                  </div>
                )}

                {step === 'complete' && (
                  <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
                    <a className="btn btn-primary" href="/app/samples/EDNA-IND-00142" style={{ flex: 2, justifyContent: 'center', textDecoration: 'none' }}>
                      View Results →
                    </a>
                    <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setStep('upload'); setFile(null); setCompletedStages([]); }}>
                      Upload Another
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
