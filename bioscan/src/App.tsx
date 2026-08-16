import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { BioParticleCursor } from './components/BioParticleCursor'
import { BootSequence } from './components/BootSequence'
import { SceneCanvas } from './3d/SceneCanvas'
import { AppShell } from './components/layout/AppShell'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SampleUpload from './pages/SampleUpload'
import Samples from './pages/Samples'
import TaxonomyView from './pages/TaxonomyView'
import BiodiversityDashboard from './pages/BiodiversityDashboard'
import BiodiversityMap from './pages/BiodiversityMap'
import Predictions from './pages/Predictions'
import AIAssistant from './pages/AIAssistant'
import Alerts from './pages/Alerts'
import Reports from './pages/Reports'

export default function App() {
  const [booting, setBooting] = useState(true)
  const onBootComplete = useCallback(() => setBooting(false), [])

  return (
    <>
      <SceneCanvas />
      <BioParticleCursor />
      {booting && <BootSequence onComplete={onBootComplete} />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upload" element={<SampleUpload />} />
          <Route path="samples" element={<Samples />} />
          <Route path="samples/:sampleId" element={<TaxonomyView />} />
          <Route path="taxonomy/:sampleId" element={<TaxonomyView />} />
          <Route path="biodiversity" element={<BiodiversityDashboard />} />
          <Route path="map" element={<BiodiversityMap />} />
          <Route path="predictions" element={<Predictions />} />
          <Route path="assistant" element={<AIAssistant />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
