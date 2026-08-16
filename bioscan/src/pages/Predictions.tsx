import { useState } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts'
import { AlertTriangle, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { MOCK_PREDICTIONS, MOCK_SITES } from '../mocks/data'

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ padding: '10px 14px', background: 'rgba(8,20,40,0.95)', border: '1px solid var(--border-glass)', borderRadius: 8, backdropFilter: 'blur(20px)' }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => p.value !== null && p.value !== undefined && (
        <p key={p.name} style={{ fontSize: 13, fontWeight: 600, color: p.stroke || p.color || 'var(--text-primary)', marginBottom: 2 }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>
      ))}
    </div>
  )
}

export default function Predictions() {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('site_palar_river')
  const [activeScenarios, setActiveScenarios] = useState<Set<number>>(new Set())
  const [invasiveReduction, setInvasiveReduction] = useState(80)
  const [pollutionChange, setPollutionChange] = useState(0)

  const prediction = MOCK_PREDICTIONS[selectedSiteId]
  const site = MOCK_SITES.find(s => s.site_id === selectedSiteId)

  if (!prediction || !site) return <div>No prediction data</div>

  const TrendIcon = prediction.forecast.trend_direction === 'DECLINE' ? TrendingDown
    : prediction.forecast.trend_direction === 'INCREASE' ? TrendingUp : Minus
  const trendColor = prediction.forecast.trend_direction === 'DECLINE' ? 'var(--red-400)'
    : prediction.forecast.trend_direction === 'INCREASE' ? 'var(--green-400)' : 'var(--amber-400)'

  // Build chart data: history + forecast
  const forecastData = [
    ...prediction.history.map(h => ({ ...h, type: 'history' })),
    { month: 'Sep \'25 (6mo)', value: null, baseline: prediction.forecast.baseline.six_months.mean, lower: prediction.forecast.baseline.six_months.lower_ci, upper: prediction.forecast.baseline.six_months.upper_ci, type: 'forecast' },
    { month: 'Mar \'26 (12mo)', value: null, baseline: prediction.forecast.baseline.twelve_months.mean, lower: prediction.forecast.baseline.twelve_months.lower_ci, upper: prediction.forecast.baseline.twelve_months.upper_ci, type: 'forecast' },
  ]

  const toggleScenario = (idx: number) => {
    setActiveScenarios(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar title="Biodiversity Predictions" subtitle="LSTM-based 12-month forecasting with what-if scenarios" />

      <div className="content-area" style={{ padding: 24 }}>
        {/* Site selector */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Site:</span>
          <select
            value={selectedSiteId}
            onChange={e => setSelectedSiteId(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: 8, background: 'var(--bg-glass)',
              border: '1px solid var(--border-glass)', color: 'var(--text-primary)',
              fontSize: 14, fontFamily: 'var(--font-sans)', cursor: 'pointer',
            }}
          >
            {Object.keys(MOCK_PREDICTIONS).map(id => {
              const s = MOCK_SITES.find(site => site.site_id === id)
              return <option key={id} value={id}>{s?.name}</option>
            })}
          </select>

          {/* Trend badge */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100, background: `${trendColor}10`, border: `1px solid ${trendColor}30` }}>
            <TrendIcon size={14} color={trendColor} />
            <span style={{ fontSize: 13, fontWeight: 700, color: trendColor }}>
              {prediction.forecast.trend_direction}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {prediction.forecast.significance === 'STATISTICALLY_SIGNIFICANT' ? '(p<0.05)' : ''}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
          {/* Main forecast chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <motion.div
              className="glass"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ padding: 24 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)', marginBottom: 2 }}>
                    LSTM Biodiversity Forecast — {site.name}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Current: <strong style={{ color: 'var(--cyan-300)' }}>{prediction.current_index}/100</strong> · Training: {prediction.forecast.training_period} · Model: {prediction.forecast.model}
                  </p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00d4c8" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#00d4c8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <ReferenceLine y={prediction.current_index} stroke="rgba(0,212,200,0.2)" strokeDasharray="4 2" label={{ value: 'Current', fill: 'var(--text-muted)', fontSize: 10 }} />

                  {/* CI band */}
                  <Area dataKey="upper" stroke="none" fill="url(#ciGrad)" name="Upper CI" />
                  <Area dataKey="lower" stroke="none" fill="var(--bg-surface)" name="Lower CI" />

                  {/* Historical */}
                  <Line dataKey="value" stroke="#00d4c8" strokeWidth={2.5} dot={false} name="Historical" connectNulls={false} />

                  {/* Baseline forecast */}
                  <Line dataKey="baseline" stroke="#00d4c8" strokeWidth={2} strokeDasharray="6 3" dot={{ fill: '#00d4c8', r: 4 }} name="Baseline Forecast" connectNulls />

                  {/* Active scenarios */}
                  {prediction.scenarios.map((scenario, i) =>
                    activeScenarios.has(i) ? (
                      <Line key={i} dataKey={`scenario_${i}`} stroke={scenario.color} strokeWidth={2} strokeDasharray="4 2" name={scenario.name} connectNulls />
                    ) : null
                  )}
                </AreaChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 24, height: 2, background: '#00d4c8' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Historical</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 24, height: 2, borderTop: '2px dashed #00d4c8', background: 'transparent' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Baseline Forecast</span>
                </div>
              </div>
            </motion.div>

            {/* Scenario toggles */}
            <motion.div className="glass" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 16 }}>
                📊 Scenario Comparison
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {prediction.scenarios.map((scenario, i) => (
                  <button
                    key={i}
                    onClick={() => toggleScenario(i)}
                    style={{
                      padding: '14px 18px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                      background: activeScenarios.has(i) ? `${scenario.color}10` : 'var(--bg-glass)',
                      border: `1px solid ${activeScenarios.has(i) ? scenario.color : 'var(--border-glass)'}`,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: scenario.color }} />
                      <span style={{ fontWeight: 600, fontSize: 13, color: scenario.color }}>{scenario.name}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 8 }}>{scenario.description}</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: scenario.color }}>{scenario.twelve_month_forecast.mean}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ 100 at 12 months</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                      CI: {scenario.twelve_month_forecast.lower_ci.toFixed(1)}–{scenario.twelve_month_forecast.upper_ci.toFixed(1)}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* What-if sliders */}
          <motion.div className="glass" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ padding: 24, alignSelf: 'flex-start' }}>
            <h3 style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
              ✦ What-If Simulator
            </h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
              Adjust environmental parameters to simulate different intervention scenarios
            </p>

            {[
              { key: 'invasive', label: 'Invasive Species Reduction', value: invasiveReduction, set: setInvasiveReduction, color: '#10b981', suffix: '%' },
              { key: 'pollution', label: 'Pollution Level Change', value: pollutionChange, set: setPollutionChange, color: '#f59e0b', suffix: '%', min: -50, max: 50 },
            ].map(({ key, label, value, set, color, suffix, min = 0, max = 100 }) => (
              <div key={key} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</label>
                  <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>
                    {value > 0 && key === 'pollution' ? '+' : ''}{value}{suffix}
                  </span>
                </div>
                <input
                  type="range" min={min} max={max} value={value}
                  onChange={e => set(Number(e.target.value))}
                  style={{ width: '100%', accentColor: color }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                  <span>{min}{suffix}</span><span>{max}{suffix}</span>
                </div>
              </div>
            ))}

            {/* Simulated outcome */}
            <div style={{ padding: 16, borderRadius: 10, background: 'rgba(0,212,200,0.06)', border: '1px solid rgba(0,212,200,0.15)', textAlign: 'center' }}>
              <div className="text-label" style={{ marginBottom: 8 }}>Simulated 12-Month Score</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--cyan-300)', letterSpacing: '-0.03em' }}>
                {Math.min(100, Math.max(0, Math.round(prediction.current_index + (invasiveReduction / 100) * 8 - (pollutionChange / 100) * 12)))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Estimated with intervention</div>
            </div>

            <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', display: 'flex', gap: 8 }}>
              <AlertTriangle size={12} color="var(--amber-400)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {prediction.forecast.disclaimer}
              </p>
            </div>

            {/* Model info */}
            <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.8, fontFamily: 'var(--font-mono)' }}>
              {prediction.forecast.inputs_used.map(inp => (
                <div key={inp}>→ {inp.replace(/_/g, ' ')}</div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
