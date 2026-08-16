import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Dna, MapPin, AlertTriangle, BarChart3, Brain } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const FEATURES = [
  { icon: Dna, title: 'AI Taxonomic Classification', desc: 'k-mer + DNABERT-2 + BLAST ensemble with explainable confidence scores' },
  { icon: BarChart3, title: 'Biodiversity Intelligence', desc: 'Shannon, Simpson, Chao1, Pielou indices with ecosystem health scoring' },
  { icon: AlertTriangle, title: 'Threat Detection', desc: 'Invasive species, WPA Schedule I–IV, IUCN Red List conservation alerts' },
  { icon: MapPin, title: 'Geospatial Monitoring', desc: 'Interactive 2D map with AI-recommended sampling locations' },
  { icon: Brain, title: 'RAG AI Assistant', desc: 'Llama 3.1-powered assistant citing your actual data, never hallucinating' },
  { icon: BarChart3, title: 'LSTM Forecasting', desc: '6/12-month biodiversity predictions with confidence intervals and what-if scenarios' },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

export default function Landing() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Content layer */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Nav */}
        <nav style={{
          padding: '20px 48px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-glass)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #00d4c8, #10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#030a12' }}>B</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>Genova</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>SIH25042</span>
          </div>
          <button
            className="btn btn-ghost"
            style={{ padding: '9px 20px', fontSize: 13 }}
            onClick={() => navigate(isAuthenticated ? '/app/dashboard' : '/login')}
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Sign In'}
          </button>
        </nav>

        {/* Hero Section */}
        <section style={{
          minHeight: '90vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '80px 48px',
          textAlign: 'center',
        }}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ maxWidth: 800 }}
          >
            {/* Label */}
            <motion.div variants={itemVariants} style={{ marginBottom: 24 }}>
              <span style={{
                display: 'inline-block',
                padding: '6px 16px', borderRadius: 100,
                background: 'rgba(0,212,200,0.1)', border: '1px solid rgba(0,212,200,0.2)',
                fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--cyan-300)', fontFamily: 'var(--font-mono)',
              }}>
                eDNA · BIODIVERSITY · INTELLIGENCE
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-display"
              style={{ marginBottom: 28, lineHeight: 1 }}
            >
              <span style={{ color: 'var(--text-primary)' }}>AI-Powered</span>
              {' '}
              <span className="text-gradient-cyan">Biodiversity</span>
              {' '}
              <span style={{ color: 'var(--text-primary)' }}>Intelligence</span>
            </motion.h1>

            {/* Subhead */}
            <motion.p
              variants={itemVariants}
              className="text-hero"
              style={{ maxWidth: 560, margin: '0 auto 48px', color: 'var(--text-secondary)' }}
            >
              Transform raw environmental DNA sequences into actionable biodiversity intelligence
              for India's ecosystems. Built for SIH 2025.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
            >
              <button
                className="btn btn-primary"
                style={{ padding: '15px 36px', fontSize: 15 }}
                onClick={() => navigate(isAuthenticated ? '/app/upload' : '/login')}
              >
                Start Analysis <ArrowRight size={18} />
              </button>
              <button
                className="btn btn-ghost"
                style={{ padding: '15px 36px', fontSize: 15 }}
                onClick={() => navigate(isAuthenticated ? '/app/dashboard' : '/login')}
              >
                <Play size={16} /> Explore Ecosystem
              </button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={itemVariants}
              style={{
                display: 'flex', justifyContent: 'center', gap: 48,
                marginTop: 64, padding: '24px 48px',
                borderTop: '1px solid var(--border-glass)',
              }}
            >
              {[
                { value: '8', label: 'Indian Sites' },
                { value: '178+', label: 'Species Tracked' },
                { value: '91%', label: 'Classification Accuracy' },
                { value: '≤5 min', label: 'Pipeline Time' },
              ].map(({ value, label }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div className="text-gradient-cyan" style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.04em' }}>
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section style={{ padding: '80px 48px', background: 'rgba(6,14,28,0.7)', backdropFilter: 'blur(4px)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ textAlign: 'center', marginBottom: 56 }}
            >
              <h2 className="text-section" style={{ marginBottom: 16 }}>
                Full-Stack <span className="text-gradient-cyan">eDNA Intelligence</span>
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 540, margin: '0 auto' }}>
                One pipeline. Upload your FASTA/FASTQ file and get taxonomic identification,
                biodiversity metrics, conservation alerts, and regulatory reports.
              </p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  className="glass"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  style={{ padding: 28, cursor: 'default' }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, marginBottom: 18,
                    background: 'rgba(0,212,200,0.1)', border: '1px solid rgba(0,212,200,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={20} color="var(--cyan-300)" />
                  </div>
                  <h3 style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)', marginBottom: 8 }}>
                    {title}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7 }}>
                    {desc}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Final CTA */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ textAlign: 'center', marginTop: 72 }}
            >
              <button
                className="btn btn-primary"
                style={{ padding: '16px 48px', fontSize: 16 }}
                onClick={() => navigate(isAuthenticated ? '/app/dashboard' : '/login')}
              >
                Launch Genova Platform <ArrowRight size={18} />
              </button>
              <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                SIH25042 | V.S.B Engineering College, Karur | Team Antigravity
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  )
}
