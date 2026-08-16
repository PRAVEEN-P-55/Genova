import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { DNAHelix } from './DNAHelix'
import { ParticleField } from './ParticleField'

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.15} color={0x0a1628} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} color={0x00d4c8} />
      <pointLight position={[-4, 2, -2]} color={0x7c3aed} intensity={0.8} distance={12} />
      <pointLight position={[4, -2, 2]} color={0x10b981} intensity={0.6} distance={10} />
    </>
  )
}

interface SceneCanvasProps {
  simplified?: boolean
}

export function SceneCanvas({ simplified = false }: SceneCanvasProps) {
  return (
    <Canvas
      style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}
      camera={{ position: [0, 0, 6], fov: 60, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: 2, // ACESFilmicToneMapping
        toneMappingExposure: 1.1,
      }}
      dpr={Math.min(window.devicePixelRatio, 2)}
    >
      <SceneLights />
      <Stars radius={60} depth={40} count={simplified ? 500 : 2000} factor={3} fade speed={0.5} />

      <Suspense fallback={null}>
        <DNAHelix />
        {!simplified && <ParticleField />}
      </Suspense>

      {!simplified && (
        <EffectComposer>
          <Bloom
            intensity={0.7}
            luminanceThreshold={0.25}
            luminanceSmoothing={0.9}
            radius={0.4}
          />
          <Vignette eskil={false} offset={0.1} darkness={0.6} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
