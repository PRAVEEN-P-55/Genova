import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { motion } from 'framer-motion'
import { Layers, MapPin, AlertTriangle, Activity } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { MOCK_SITES, MOCK_ALERTS } from '../mocks/data'
import type { Site } from '../types'

const HEALTH_COLORS: Record<string, string> = {
  HEALTHY: '#10b981',
  MODERATE: '#f59e0b',
  DEGRADED: '#f97316',
  CRITICAL: '#ef4444',
}

function createSiteIcon(site: Site) {
  const color = HEALTH_COLORS[site.health_classification]
  const hasAlerts = site.active_alerts > 0
  return L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `
      <div style="
        width:36px;height:36px;border-radius:50%;
        background:${color}22;
        border:2.5px solid ${color};
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 12px ${color}66;
        position:relative;
        font-size:12px;font-weight:700;color:${color};
        font-family:'Space Grotesk',sans-serif;
      ">
        ${site.latest_health_score}
        ${hasAlerts ? `<div style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;border-radius:50%;background:#ef4444;border:2px solid #030a12;animation:pulse 1.5s infinite;"></div>` : ''}
      </div>
    `,
  })
}

export default function BiodiversityMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [layers, setLayers] = useState({ sites: true, alerts: true, recommendations: true })

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '©OpenStreetMap, ©CartoDB',
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Site markers
    MOCK_SITES.forEach(site => {
      const marker = L.marker([site.lat, site.lon], { icon: createSiteIcon(site) })
        .addTo(map)

      const popupContent = `
        <div style="min-width:220px;font-family:'Space Grotesk',sans-serif;">
          <div style="font-weight:700;font-size:15px;color:#e2e8f0;margin-bottom:4px;">${site.name}</div>
          <div style="font-size:12px;color:#64748b;margin-bottom:12px;">${site.state} · ${site.ecosystem_type.replace(/_/g,' ')}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div>
              <div style="font-size:10px;color:#64748b;margin-bottom:2px;">HEALTH SCORE</div>
              <div style="font-size:20px;font-weight:700;color:${HEALTH_COLORS[site.health_classification]};">${site.latest_health_score}</div>
            </div>
            <div>
              <div style="font-size:10px;color:#64748b;margin-bottom:2px;">SPECIES</div>
              <div style="font-size:20px;font-weight:700;color:#00d4c8;">${site.species_detected}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px;">
            <span style="padding:3px 8px;border-radius:100px;font-size:10px;font-weight:600;background:${site.active_alerts>0?'rgba(239,68,68,0.15)':'rgba(16,185,129,0.15)'};color:${site.active_alerts>0?'#f87171':'#34d399'};border:1px solid ${site.active_alerts>0?'rgba(239,68,68,0.3)':'rgba(16,185,129,0.3)'};">
              ${site.active_alerts} Alert${site.active_alerts !== 1 ? 's' : ''}
            </span>
            <span style="padding:3px 8px;border-radius:100px;font-size:10px;font-weight:600;background:rgba(0,212,200,0.1);color:#00d4c8;border:1px solid rgba(0,212,200,0.25);">
              ${site.total_samples} Samples
            </span>
          </div>
        </div>
      `
      marker.bindPopup(popupContent, {
        maxWidth: 280,
        className: 'genova-popup',
      })
      marker.on('click', () => setSelectedSite(site))
    })

    // AI-recommended sampling pin (pulsing)
    const recIcon = L.divIcon({
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      html: `
        <div style="width:28px;height:28px;border-radius:50%;background:rgba(0,212,200,0.1);border:2px solid #00d4c8;display:flex;align-items:center;justify-content:center;animation:pulse 2s infinite;">
          <div style="width:8px;height:8px;border-radius:50%;background:#00d4c8;"></div>
        </div>
      `,
    })
    L.marker([13.0142, 79.9328], { icon: recIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:'Space Grotesk',sans-serif;min-width:200px;">
          <div style="font-weight:700;color:#00d4c8;margin-bottom:6px;">🤖 AI-Recommended Site</div>
          <div style="font-size:12px;color:#94a3b8;line-height:1.6;">
            Upstream tributary confluence<br>4.2km NW of Palar monitoring site<br>
            <strong style="color:#e2e8f0;">Priority: HIGH</strong>
          </div>
        </div>
      `)

    mapInstanceRef.current = map
    return () => { map.remove(); mapInstanceRef.current = null }
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Biodiversity Map" subtitle="Interactive site health monitoring · India" />

      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        {/* Map */}
        <div ref={mapRef} style={{ flex: 1, minHeight: 600 }} />

        {/* Layer controls */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass"
          style={{ position: 'absolute', top: 16, right: 16, padding: 16, width: 200, zIndex: 1000 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Layers size={14} color="var(--cyan-300)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Map Layers</span>
          </div>
          {[
            { key: 'sites', label: 'Site Markers', icon: MapPin, color: 'var(--cyan-300)' },
            { key: 'alerts', label: 'Active Alerts', icon: AlertTriangle, color: 'var(--red-400)' },
            { key: 'recommendations', label: 'AI Recommendations', icon: Activity, color: 'var(--cyan-400)' },
          ].map(({ key, label, icon: Icon, color }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={layers[key as keyof typeof layers]}
                onChange={e => setLayers(prev => ({ ...prev, [key]: e.target.checked }))}
                style={{ accentColor: 'var(--cyan-400)' }}
              />
              <Icon size={12} color={color} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
            </label>
          ))}
        </motion.div>

        {/* Health Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass"
          style={{ position: 'absolute', bottom: 16, left: 16, padding: '14px 18px', zIndex: 1000 }}
        >
          <div className="text-label" style={{ marginBottom: 10 }}>Health Zones</div>
          {[
            { label: 'Healthy (≥80)', color: '#10b981' },
            { label: 'Moderate (60–79)', color: '#f59e0b' },
            { label: 'Degraded (40–59)', color: '#f97316' },
            { label: 'Critical (<40)', color: '#ef4444' },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}66` }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Site detail panel */}
        {selectedSite && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="glass"
            style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: 300, zIndex: 1001,
              padding: 24, overflowY: 'auto', borderRadius: 0, borderLeft: '1px solid var(--border-glass)',
            }}
          >
            <button onClick={() => setSelectedSite(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 16, float: 'right' }}>×</button>
            <div style={{ clear: 'both' }}>
              <h3 style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', marginBottom: 4 }}>{selectedSite.name}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>{selectedSite.state} · {selectedSite.ecosystem_type.replace(/_/g, ' ')}</p>
              <div style={{
                padding: 16, borderRadius: 12, marginBottom: 16,
                background: `${HEALTH_COLORS[selectedSite.health_classification]}10`,
                border: `1px solid ${HEALTH_COLORS[selectedSite.health_classification]}30`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 44, fontWeight: 700, color: HEALTH_COLORS[selectedSite.health_classification] }}>
                  {selectedSite.latest_health_score}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: HEALTH_COLORS[selectedSite.health_classification], textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {selectedSite.health_classification}
                </div>
              </div>
              {[
                ['Species Detected', selectedSite.species_detected],
                ['Total Samples', selectedSite.total_samples],
                ['Active Alerts', selectedSite.active_alerts],
                ['Last Sample', selectedSite.latest_sample_date],
              ].map(([label, value]) => (
                <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-glass)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
