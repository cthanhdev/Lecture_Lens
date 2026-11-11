import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { SakuraPetalsMesh } from './SakuraPetalsMesh.tsx'
import { TorusHaloMesh } from './TorusHaloMesh.tsx'

export interface KitsuneSakuraCanvasProps {
  /** Chế độ hiển thị: 'splash' có vòng halo; 'onboarding' chỉ có cánh hoa rơi */
  mode?: 'splash' | 'onboarding'
  /** Số lượng cánh hoa bay trong không gian (mặc định 24) */
  petalCount?: number
  /** Cho phép tương tác phản hồi với trỏ chuột / cảm ứng */
  interactive?: boolean
  className?: string
}

export function KitsuneSakuraCanvas({
  mode = 'onboarding',
  petalCount = 24,
  interactive = true,
  className = '',
}: KitsuneSakuraCanvasProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Nếu người dùng bật chế độ giảm chuyển động, hiển thị nền tĩnh an toàn
  if (prefersReducedMotion) {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
        aria-hidden="true"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#F5C3C9]/25 blur-3xl" />
      </div>
    )
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'low-power',
        }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.9} />
        {mode === 'splash' && <TorusHaloMesh position={[0, 0.45, -0.6]} />}
        <SakuraPetalsMesh count={petalCount} interactive={interactive} />
      </Canvas>
    </div>
  )
}
