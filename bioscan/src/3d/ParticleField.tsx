import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = typeof window !== 'undefined' && window.innerWidth < 768 ? 150 : 600

export function ParticleField() {
  const meshRef = useRef<THREE.Points>(null)
  const connectorRef = useRef<THREE.LineSegments>(null)

  const { positions, velocities, colors } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const velocities = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)

    const palette = [
      new THREE.Color(0x00d4c8), // cyan
      new THREE.Color(0x10b981), // green
      new THREE.Color(0x7c3aed), // violet
      new THREE.Color(0x00a39b), // dark cyan
    ]

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 18
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 4
      velocities[i * 3]     = (Math.random() - 0.5) * 0.004
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.003
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002
      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3]     = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    return { positions, velocities, colors }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [positions, colors])

  const connectorGeometry = useMemo(() => new THREE.BufferGeometry(), [])

  useFrame(() => {
    if (!meshRef.current || !connectorRef.current) return
    const posAttr = meshRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
    const pos = posAttr.array as Float32Array

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3]     += velocities[i * 3]
      pos[i * 3 + 1] += velocities[i * 3 + 1]
      pos[i * 3 + 2] += velocities[i * 3 + 2]
      // Wrap bounds
      if (pos[i * 3] > 9)  pos[i * 3] = -9
      if (pos[i * 3] < -9) pos[i * 3] = 9
      if (pos[i * 3 + 1] > 7)  pos[i * 3 + 1] = -7
      if (pos[i * 3 + 1] < -7) pos[i * 3 + 1] = 7
    }
    posAttr.needsUpdate = true

    // Connector lines (max 50 pairs, distance threshold 2.5)
    const lineVerts: number[] = []
    const checked = new Set<number>()
    for (let i = 0; i < PARTICLE_COUNT && lineVerts.length < 300; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT && lineVerts.length < 300; j++) {
        const key = i * PARTICLE_COUNT + j
        if (checked.has(key)) continue
        checked.add(key)
        const dx = pos[i * 3] - pos[j * 3]
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1]
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < 2.2) {
          lineVerts.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])
          lineVerts.push(pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2])
        }
      }
    }
    connectorGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3))
    connectorRef.current.geometry = connectorGeometry
  })

  return (
    <>
      <points ref={meshRef} geometry={geometry}>
        <pointsMaterial
          size={0.045}
          vertexColors
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <lineSegments ref={connectorRef}>
        <lineBasicMaterial color={0x00706b} transparent opacity={0.18} depthWrite={false} />
      </lineSegments>
    </>
  )
}
