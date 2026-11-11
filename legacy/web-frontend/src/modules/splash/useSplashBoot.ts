import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppNavigation } from '../../router/useAppNavigation.ts'

export interface SplashBootState {
  progress: number
  isReady: boolean
  skip: () => void
}

export function useSplashBoot(durationMs: number = 2000): SplashBootState {
  const nav = useAppNavigation()
  const [progress, setProgress] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const frameIdRef = useRef<number | null>(null)

  const proceed = useCallback(() => {
    setIsReady(true)
    const isCompleted = localStorage.getItem('lecturelens_onboarding_completed') === 'true'
    if (isCompleted) {
      nav.goTo('/home', { replace: true })
    } else {
      nav.goTo('/onboarding/step-1', { replace: true })
    }
  }, [nav])

  useEffect(() => {
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const currentProgress = Math.min(100, Math.round((elapsed / durationMs) * 100))
      setProgress(currentProgress)

      if (elapsed < durationMs) {
        frameIdRef.current = requestAnimationFrame(tick)
      } else {
        proceed()
      }
    }

    frameIdRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current)
      }
    }
  }, [durationMs, proceed])

  return {
    progress,
    isReady,
    skip: proceed,
  }
}
