import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Icon } from '../../../../components/ui/icons/Icon.tsx'

interface FoxModelProps {
  isTypingPassword?: boolean
}

function StylizedKitsuneFox({ isTypingPassword = false }: FoxModelProps) {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame(({ pointer }) => {
    if (!groupRef.current) return

    if (isTypingPassword) {
      // Khi đang gõ mật khẩu: Cáo ngoảnh mặt đi hoặc cúi đầu ngượng ngùng (Peek-a-boo)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0.75, 0.1)
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.35, 0.1)
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, -0.08, 0.1)
    } else {
      // Bình thường: Mắt & đầu cáo chuyển động theo con trỏ chuột
      const targetY = pointer.x * 0.45
      const targetX = -pointer.y * 0.25
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.08)
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.08)
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.08)
    }
  })

  return (
    <group ref={groupRef} position={[0, -0.15, 0]}>
      {/* 1. Đầu Cáo (Trắng sữa mềm mại) */}
      <mesh position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial color="#FFF9FB" roughness={0.4} metalness={0.05} />
      </mesh>

      {/* Mõm Cáo */}
      <mesh position={[0, 0.12, 0.42]} rotation={[0.2, 0, 0]}>
        <coneGeometry args={[0.22, 0.38, 32]} />
        <meshStandardMaterial color="#FFF5F7" roughness={0.4} />
      </mesh>

      {/* Mũi mận chín */}
      <mesh position={[0, 0.26, 0.52]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#261333" roughness={0.2} />
      </mesh>

      {/* Hai mắt hạt huyền Kawaii */}
      <mesh position={[-0.2, 0.32, 0.45]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#261333" roughness={0.1} />
      </mesh>
      <mesh position={[0.2, 0.32, 0.45]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#261333" roughness={0.1} />
      </mesh>

      {/* Hai má hồng Sakura */}
      <mesh position={[-0.32, 0.2, 0.38]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#F5C3C9" roughness={0.6} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.32, 0.2, 0.38]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#F5C3C9" roughness={0.6} transparent opacity={0.7} />
      </mesh>

      {/* Tai Trái */}
      <group position={[-0.35, 0.72, 0]} rotation={[0, 0, 0.25]}>
        <mesh>
          <coneGeometry args={[0.2, 0.42, 16]} />
          <meshStandardMaterial color="#FFF9FB" roughness={0.4} />
        </mesh>
        {/* Lòng tai Sakura */}
        <mesh position={[0, 0, 0.05]} scale={[0.65, 0.65, 0.65]}>
          <coneGeometry args={[0.2, 0.42, 16]} />
          <meshStandardMaterial color="#F5C3C9" roughness={0.5} />
        </mesh>
      </group>

      {/* Tai Phải */}
      <group position={[0.35, 0.72, 0]} rotation={[0, 0, -0.25]}>
        <mesh>
          <coneGeometry args={[0.2, 0.42, 16]} />
          <meshStandardMaterial color="#FFF9FB" roughness={0.4} />
        </mesh>
        {/* Lòng tai Sakura */}
        <mesh position={[0, 0, 0.05]} scale={[0.65, 0.65, 0.65]}>
          <coneGeometry args={[0.2, 0.42, 16]} />
          <meshStandardMaterial color="#F5C3C9" roughness={0.5} />
        </mesh>
      </group>

      {/* Vòng cổ đỏ Torii & Chuông vàng Suzu */}
      <mesh position={[0, -0.15, 0]}>
        <torusGeometry args={[0.42, 0.045, 16, 32]} />
        <meshStandardMaterial color="#F47F72" roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.18, 0.42]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#FFE27A" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

interface MascotAvatar3DProps {
  isTypingPassword?: boolean
}

export function MascotAvatar3D({ isTypingPassword = false }: MascotAvatar3DProps) {
  const [hasWebGL] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false
      const canvas = document.createElement('canvas')
      return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    } catch {
      return false
    }
  })

  return (
    <div className="w-24 h-24 rounded-[28px] miruku-glass border border-white/90 shadow-md mb-5 mx-auto flex items-center justify-center relative overflow-hidden group select-none">
      {/* Ánh sáng hào quang Sakura phía sau */}
      <div className="absolute inset-2 rounded-[22px] bg-gradient-to-tr from-[#F5C3C9]/40 via-white/80 to-[#FFE27A]/30" />

      {hasWebGL ? (
        <div className="w-full h-full relative z-10 cursor-grab active:cursor-grabbing">
          <Canvas
            camera={{ position: [0, 0.1, 2.2], fov: 42 }}
            gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
            dpr={[1, 1.5]}
          >
            <ambientLight intensity={1.3} />
            <directionalLight position={[2, 4, 3]} intensity={1.2} />
            <pointLight position={[-2, 1, 2]} intensity={0.5} color="#F5C3C9" />
            <StylizedKitsuneFox isTypingPassword={isTypingPassword} />
          </Canvas>
        </div>
      ) : (
        <div className="w-16 h-16 rounded-[20px] bg-white flex items-center justify-center text-[#F47F72] relative z-10 shadow-xs">
          <Icon name="kitsune-fox" size="2xl" blob="sakura" />
        </div>
      )}
    </div>
  )
}
