import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export function DNAHelix() {
  const groupRef = useRef<THREE.Group>(null)
  const { mouse } = useThree()

  const { strand1Points, strand2Points, rungPairs } = useMemo(() => {
    const pts1: THREE.Vector3[] = []
    const pts2: THREE.Vector3[] = []
    const pairs: [THREE.Vector3, THREE.Vector3][] = []
    const TURNS = 4
    const HEIGHT = 6
    const RADIUS = 0.7
    const SEGMENTS = 120

    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS
      const angle = t * Math.PI * 2 * TURNS
      const y = (t - 0.5) * HEIGHT
      pts1.push(new THREE.Vector3(Math.cos(angle) * RADIUS, y, Math.sin(angle) * RADIUS))
      pts2.push(new THREE.Vector3(Math.cos(angle + Math.PI) * RADIUS, y, Math.sin(angle + Math.PI) * RADIUS))
    }

    for (let i = 0; i <= SEGMENTS; i += 8) {
      pairs.push([pts1[i].clone(), pts2[i].clone()])
    }

    return { strand1Points: pts1, strand2Points: pts2, rungPairs: pairs }
  }, [])

  const strandMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x00d4c8),
    emissive: new THREE.Color(0x003d3a),
    transmission: 0.6,
    roughness: 0.05,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: 0.85,
  }), [])

  const rungMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x00bdb5),
    emissive: new THREE.Color(0x002d2b),
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.3,
    transparent: true,
    opacity: 0.7,
  }), [])

  const nodeMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x00d4c8),
    emissive: new THREE.Color(0x00d4c8),
    emissiveIntensity: 1.2,
    roughness: 0,
    metalness: 0.5,
    transparent: true,
    opacity: 0.9,
  }), [])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    groupRef.current.rotation.y = t * 0.12
    groupRef.current.position.y = Math.sin(t * 0.3) * 0.2
    // Subtle mouse parallax
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, mouse.y * 0.08, 0.05)
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -mouse.x * 0.06, 0.05)
  })

  const createStrandGeometry = (points: THREE.Vector3[]) => {
    const curve = new THREE.CatmullRomCurve3(points)
    return new THREE.TubeGeometry(curve, 120, 0.04, 8, false)
  }

  return (
    <group ref={groupRef}>
      {/* Strand 1 */}
      <mesh geometry={createStrandGeometry(strand1Points)} material={strandMaterial} />
      {/* Strand 2 */}
      <mesh geometry={createStrandGeometry(strand2Points)} material={strandMaterial} />

      {/* Base pair rungs */}
      {rungPairs.map((pair, i) => {
        const start = pair[0]
        const end = pair[1]
        const dir = end.clone().sub(start)
        const len = dir.length()
        const mid = start.clone().add(end).multiplyScalar(0.5)
        const arrow = new THREE.ArrowHelper(dir.normalize(), start, len)
        const euler = new THREE.Euler().setFromQuaternion(arrow.quaternion)

        return (
          <group key={i}>
            <mesh
              position={[mid.x, mid.y, mid.z]}
              rotation={[euler.x, euler.y, euler.z]}
              material={rungMaterial}
            >
              <cylinderGeometry args={[0.018, 0.018, len, 6]} />
            </mesh>
            {/* Node spheres at ends */}
            <mesh position={[start.x, start.y, start.z]} material={nodeMaterial}>
              <sphereGeometry args={[0.055, 8, 8]} />
            </mesh>
            <mesh position={[end.x, end.y, end.z]} material={nodeMaterial}>
              <sphereGeometry args={[0.055, 8, 8]} />
            </mesh>
          </group>
        )
      })}

      {/* Point lights along helix */}
      <pointLight position={[0, 2, 0]} color={0x00d4c8} intensity={1.5} distance={5} />
      <pointLight position={[0, -2, 0]} color={0x10b981} intensity={1.0} distance={4} />
    </group>
  )
}
