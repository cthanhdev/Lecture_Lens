import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PetalData {
  position: THREE.Vector3
  rotation: THREE.Euler
  rotationSpeed: THREE.Vector3
  speed: number
  wobbleSpeed: number
  wobbleAmp: number
  phase: number
}

function generatePetals(count: number): PetalData[] {
  return Array.from({ length: count }, () => ({
    position: new THREE.Vector3(
      (Math.random() - 0.5) * 12,
      Math.random() * 10 - 2,
      (Math.random() - 0.5) * 6
    ),
    rotation: new THREE.Euler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    ),
    rotationSpeed: new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02
    ),
    speed: 0.008 + Math.random() * 0.012,
    wobbleSpeed: 0.8 + Math.random() * 1.2,
    wobbleAmp: 0.006 + Math.random() * 0.008,
    phase: Math.random() * Math.PI * 2,
  }))
}

function PetalsInstanced({ count = 35 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const [initialPetals] = useState<PetalData[]>(() => generatePetals(count))
  const petalsRef = useRef<PetalData[]>(initialPetals)

  // Cập nhật vị trí và góc quay từng frame
  useFrame(({ clock, pointer }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    const petals = petalsRef.current

    // Lực gió theo vị trí con trỏ chuột (Parallax Wind)
    const windX = pointer.x * 0.015
    const windY = -pointer.y * 0.008

    for (let i = 0; i < petals.length; i++) {
      const p = petals[i]

      // Rơi xuống và lắc lư hình sin
      p.position.y -= p.speed + windY
      p.position.x += Math.sin(t * p.wobbleSpeed + p.phase) * p.wobbleAmp + windX

      // Quay chao lượn
      p.rotation.x += p.rotationSpeed.x
      p.rotation.y += p.rotationSpeed.y
      p.rotation.z += p.rotationSpeed.z

      // Reset lên trên khi rơi quá màn hình
      if (p.position.y < -5) {
        p.position.y = 6
        p.position.x = (Math.random() - 0.5) * 12
      }
      if (p.position.x > 7) p.position.x = -7
      if (p.position.x < -7) p.position.x = 7

      dummy.position.copy(p.position)
      dummy.rotation.copy(p.rotation)
      dummy.scale.set(0.18, 0.28, 0.18)
      dummy.updateMatrix()

      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  // Hình học cong cánh hoa hình giọt nước / oval mềm
  const petalGeometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(1, 1.4, 4, 4)
    const pos = geom.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      pos.setZ(i, -Math.sin((y + 0.7) * 2) * 0.15)
    }
    geom.computeVertexNormals()
    return geom
  }, [])

  return (
    <instancedMesh
      ref={meshRef}
      args={[petalGeometry, undefined, count]}
    >
      <meshStandardMaterial
        color="#FDCBD1"
        roughness={0.7}
        metalness={0.05}
        side={THREE.DoubleSide}
        transparent
        opacity={0.75}
      />
    </instancedMesh>
  )
}

interface EmberData {
  position: THREE.Vector3
  speed: number
  scale: number
  phase: number
}

function generateEmbers(count: number): EmberData[] {
  return Array.from({ length: count }, () => ({
    position: new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 4
    ),
    speed: 0.003 + Math.random() * 0.006,
    scale: 0.04 + Math.random() * 0.04,
    phase: Math.random() * Math.PI * 2,
  }))
}

function EmberParticles({ count = 15 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const [initialEmbers] = useState<EmberData[]>(() => generateEmbers(count))
  const embersRef = useRef<EmberData[]>(initialEmbers)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    const embers = embersRef.current

    for (let i = 0; i < embers.length; i++) {
      const e = embers[i]
      e.position.y += e.speed
      e.position.x += Math.cos(t * 0.5 + e.phase) * 0.003

      if (e.position.y > 5) e.position.y = -5

      dummy.position.copy(e.position)
      const pulse = e.scale * (1 + 0.3 * Math.sin(t * 2 + e.phase))
      dummy.scale.set(pulse, pulse, pulse)
      dummy.updateMatrix()

      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#FFE27A" transparent opacity={0.55} />
    </instancedMesh>
  )
}

/**
 * FloatingPetalsCanvas: Tầng Three.js Canvas 3D chạy ngầm tạo không khí Kawaii-Calm
 */
export function FloatingPetalsCanvas() {
  const [hasWebGL] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false
      const canvas = document.createElement('canvas')
      return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    } catch {
      return false
    }
  })

  if (!hasWebGL) {
    // 2D Fallback: Hiển thị mảng cánh hoa CSS nhẹ nhàng
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-8 w-4 h-6 rounded-full bg-[#FDCBD1]/60 blur-xs rotate-12" />
        <div className="absolute top-1/3 right-12 w-5 h-7 rounded-full bg-[#F47F72]/40 blur-xs -rotate-45" />
        <div className="absolute bottom-1/4 left-1/3 w-3 h-5 rounded-full bg-[#EBBAC0]/50 blur-xs rotate-45" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[2, 5, 2]} intensity={0.8} />
        <PetalsInstanced count={35} />
        <EmberParticles count={15} />
      </Canvas>
    </div>
  )
}
