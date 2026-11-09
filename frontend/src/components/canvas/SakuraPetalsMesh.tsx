import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SakuraPetalsMeshProps {
  count?: number
  interactive?: boolean
}

interface PetalData {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  rotX: number
  rotY: number
  rotZ: number
  rotSpeedX: number
  rotSpeedY: number
  rotSpeedZ: number
  swaySpeed: number
  swayOffset: number
  scale: number
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999.123) * 10000
  return x - Math.floor(x)
}

function generatePetalData(total: number): PetalData[] {
  const list: PetalData[] = []
  for (let i = 0; i < total; i++) {
    const s1 = seededRandom(i * 1.1 + 1)
    const s2 = seededRandom(i * 2.3 + 2)
    const s3 = seededRandom(i * 3.7 + 3)
    const s4 = seededRandom(i * 4.9 + 4)
    const s5 = seededRandom(i * 5.2 + 5)
    const s6 = seededRandom(i * 6.8 + 6)
    const s7 = seededRandom(i * 7.4 + 7)
    const s8 = seededRandom(i * 8.1 + 8)

    list.push({
      x: (s1 - 0.5) * 8,
      y: (s2 - 0.5) * 8,
      z: (s3 - 0.5) * 4,
      vx: 0,
      vy: -0.008 - s4 * 0.012,
      vz: 0,
      rotX: s5 * Math.PI * 2,
      rotY: s6 * Math.PI * 2,
      rotZ: s7 * Math.PI * 2,
      rotSpeedX: (s1 - 0.5) * 0.02,
      rotSpeedY: (s2 - 0.5) * 0.02,
      rotSpeedZ: (s3 - 0.5) * 0.015,
      swaySpeed: 1.2 + s5 * 1.5,
      swayOffset: s6 * Math.PI * 2,
      scale: 0.45 + s8 * 0.45,
    })
  }
  return list
}

export function SakuraPetalsMesh({ count = 28, interactive = true }: SakuraPetalsMeshProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const petalsRef = useRef<PetalData[]>([])

  useEffect(() => {
    petalsRef.current = generatePetalData(count)
  }, [count])

  // Tạo hình dạng cánh hoa anh đào uốn lượn bằng ShapeGeometry
  const petalGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, -0.2)
    shape.bezierCurveTo(0.18, -0.1, 0.22, 0.15, 0, 0.3)
    shape.bezierCurveTo(-0.22, 0.15, -0.18, -0.1, 0, -0.2)
    const geom = new THREE.ShapeGeometry(shape, 6)
    geom.center()
    return geom
  }, [])

  // Vật liệu mờ mịn màu hồng Sakura (#F5C3C9) với tương tác ánh sáng dịu
  const petalMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color('#F5C3C9'),
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  }, [])

  useFrame((state) => {
    if (!meshRef.current || petalsRef.current.length === 0) return
    const time = state.clock.getElapsedTime()
    const pointer = state.pointer // Tọa độ chuột chuẩn hóa [-1, 1]
    const petals = petalsRef.current

    for (let i = 0; i < count; i++) {
      const p = petals[i]
      if (!p) continue

      // Chuyển động đung đưa theo hàm sin (sway effect)
      const swayX = Math.sin(time * p.swaySpeed + p.swayOffset) * 0.006
      p.x += p.vx + swayX
      p.y += p.vy
      p.z += p.vz

      // Xoay cánh hoa tự nhiên
      p.rotX += p.rotSpeedX
      p.rotY += p.rotSpeedY
      p.rotZ += p.rotSpeedZ

      // Tương tác đẩy hoa khi rê chuột
      if (interactive) {
        const mouseWorldX = pointer.x * 4
        const mouseWorldY = pointer.y * 3
        const dx = p.x - mouseWorldX
        const dy = p.y - mouseWorldY
        const distSq = dx * dx + dy * dy
        if (distSq < 1.2) {
          const force = (1.2 - distSq) * 0.015
          p.x += dx * force
          p.y += dy * force
        }
      }

      // Giảm dần vận tốc phản hồi
      p.vx *= 0.95
      p.vz *= 0.95

      // Tái sinh cánh hoa khi rơi xuống dưới màn hình
      if (p.y < -4.5) {
        p.y = 4.5
        p.x = ((i % 7) / 7 - 0.5) * 8
      }
      if (p.x < -4.5) p.x = 4.5
      if (p.x > 4.5) p.x = -4.5

      // Cập nhật ma trận biến đổi của instance
      dummy.position.set(p.x, p.y, p.z)
      dummy.rotation.set(p.rotX, p.rotY, p.rotZ)
      dummy.scale.set(p.scale, p.scale, p.scale)
      dummy.updateMatrix()

      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[petalGeometry, petalMaterial, count]}
      frustumCulled={false}
    />
  )
}
