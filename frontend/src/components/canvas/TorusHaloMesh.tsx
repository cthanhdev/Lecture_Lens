import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface TorusHaloMeshProps {
  position?: [number, number, number]
  radius?: number
  tubeRadius?: number
}

function generateParticles(radius: number, pCount: number) {
  const positions = new Float32Array(pCount * 3)
  for (let i = 0; i < pCount; i++) {
    const angle = (i / pCount) * Math.PI * 2
    const offset = Math.sin(i * 1.7) * 0.2
    const r = radius + offset
    positions[i * 3] = Math.cos(angle) * r
    positions[i * 3 + 1] = Math.sin(angle) * r
    positions[i * 3 + 2] = Math.cos(i * 2.3) * 0.15
  }
  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return geom
}

export function TorusHaloMesh({
  position = [0, 0.4, -0.5],
  radius = 1.6,
  tubeRadius = 0.025,
}: TorusHaloMeshProps) {
  const haloGroupRef = useRef<THREE.Group>(null!)
  const ringRef = useRef<THREE.Mesh>(null!)
  const particlesRef = useRef<THREE.Points>(null!)

  // Hình học vòng hào quang
  const ringGeom = useMemo(() => {
    return new THREE.TorusGeometry(radius, tubeRadius, 16, 64)
  }, [radius, tubeRadius])

  // Vật liệu hào quang phát sáng màu Kitsune Coral pha Sakura Pink
  const ringMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color('#F47F72'),
      transparent: true,
      opacity: 0.45,
    })
  }, [])

  // Các hạt đốm sáng bay quanh vòng hào quang
  const particleGeom = useMemo(() => {
    return generateParticles(radius, 14)
  }, [radius])

  const particleMat = useMemo(() => {
    return new THREE.PointsMaterial({
      color: new THREE.Color('#FFE27A'),
      size: 0.06,
      transparent: true,
      opacity: 0.75,
    })
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.15
      // Nhịp thở phát sáng êm dịu (breathing pulse)
      const pulse = 0.45 + Math.sin(time * 1.8) * 0.1
      const mat = ringRef.current.material as THREE.MeshBasicMaterial
      if (mat) {
        mat.opacity = pulse
      }
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.z = -time * 0.08
    }
    if (haloGroupRef.current) {
      // Đung đưa nhẹ tạo chiều sâu 3D
      haloGroupRef.current.rotation.x = 0.25 + Math.sin(time * 0.8) * 0.05
      haloGroupRef.current.rotation.y = Math.cos(time * 0.6) * 0.08
    }
  })

  return (
    <group ref={haloGroupRef} position={position}>
      <mesh ref={ringRef} geometry={ringGeom} material={ringMat} />
      <points ref={particlesRef} geometry={particleGeom} material={particleMat} />
    </group>
  )
}
