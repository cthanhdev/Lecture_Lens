import { useEffect, useRef, type ComponentRef, type RefObject } from 'react'
import { Keyboard, Platform, type View } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'
import {
  clampAuthProgress,
  type AuthScreenStep,
} from '../../modules/auth'

interface UseWebAuthPagerOptions {
  enabled: boolean
  frameWidth: number
  scrollProgress: SharedValue<number>
  activeStepRef: RefObject<AuthScreenStep>
  onProgressSync: (nextProgress: number, roundedStep: AuthScreenStep) => void
  onRequestSnapToStep: (targetStep: AuthScreenStep) => void
}

function isHtmlElement(node: unknown): node is HTMLElement {
  return (
    typeof node === 'object' &&
    node !== null &&
    'scrollLeft' in node &&
    'scrollWidth' in node &&
    'addEventListener' in node
  )
}

function findHorizontalScrollContainer(root: unknown): HTMLElement | null {
  if (!isHtmlElement(root)) return null

  const queue: HTMLElement[] = [root]
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue

    const overflowX =
      typeof window !== 'undefined'
        ? window.getComputedStyle(current).overflowX
        : ''
    const isHorizontallyScrollable =
      (overflowX === 'auto' || overflowX === 'scroll') &&
      current.scrollWidth > current.clientWidth + 4

    if (isHorizontallyScrollable) {
      return current
    }

    for (let i = 0; i < current.children.length; i += 1) {
      const child = current.children[i]
      if (isHtmlElement(child)) {
        queue.push(child)
      }
    }
  }

  return null
}

function isInteractiveInputTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === 'undefined' || !(target instanceof HTMLElement)) {
    return false
  }
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

/**
 * Web DOM bridge ensuring real-time `scrollProgress` sync across programmatic `scrollTo`,
 * mobile touch swiping, trackpad horizontal scroll, AND desktop mouse-drag swiping.
 * Uses capture-phase scroll observation + lazy DOM traversal to eliminate mount-timing races.
 * No-ops cleanly on native iOS/Android where Reanimated `useAnimatedScrollHandler` owns the UI thread.
 */
export function useWebAuthPager({
  enabled,
  frameWidth,
  scrollProgress,
  activeStepRef,
  onProgressSync,
  onRequestSnapToStep,
}: UseWebAuthPagerOptions) {
  const hostRef = useRef<ComponentRef<typeof View> | null>(null)
  const lastDragEndTimeRef = useRef(0)

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || frameWidth <= 0) return undefined

    const host = hostRef.current
    if (!isHtmlElement(host)) return undefined

    const originalHostUserSelect = host.style.userSelect
    host.style.userSelect = 'none'

    const resolvePagerScrollEl = () => findHorizontalScrollContainer(host)

    // Align initial offset cleanly once DOM metrics exist
    const initialPagerEl = resolvePagerScrollEl()
    if (initialPagerEl) {
      const initialTargetX = activeStepRef.current * frameWidth
      if (Math.abs(initialPagerEl.scrollLeft - initialTargetX) > 2) {
        initialPagerEl.scrollLeft = initialTargetX
        scrollProgress.set(activeStepRef.current)
      }
    }

    const syncFromScrollEl = (scrollEl: HTMLElement) => {
      if (scrollEl.scrollWidth <= scrollEl.clientWidth + 4) return
      const nextProgress = clampAuthProgress(scrollEl.scrollLeft / frameWidth)
      scrollProgress.set(nextProgress)
      const rounded: AuthScreenStep = nextProgress >= 0.5 ? 1 : 0
      onProgressSync(nextProgress, rounded)
    }

    const handleCaptureScroll = (event: Event) => {
      const target = event.target
      if (!isHtmlElement(target) || typeof window === 'undefined') return
      const overflowX = window.getComputedStyle(target).overflowX
      if (
        (overflowX === 'auto' || overflowX === 'scroll') &&
        target.scrollWidth > target.clientWidth + 4
      ) {
        syncFromScrollEl(target)
      }
    }

    let isDragging = false
    let didPanHorizontally = false
    let startX = 0
    let startY = 0
    let startScrollLeft = 0
    let startTime = 0
    let priorSnapType = ''
    let priorUserSelect = ''
    let activePagerEl: HTMLElement | null = null

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || event.button !== 0) return
      if (isInteractiveInputTarget(event.target)) return
      const pagerEl = resolvePagerScrollEl()
      if (!pagerEl) return

      activePagerEl = pagerEl
      isDragging = true
      didPanHorizontally = false
      startX = event.clientX
      startY = event.clientY
      startScrollLeft = pagerEl.scrollLeft
      startTime = Date.now()
      priorSnapType = pagerEl.style.scrollSnapType
      priorUserSelect = document.body.style.userSelect
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging || !activePagerEl || event.pointerType === 'touch') return
      const dx = event.clientX - startX
      const dy = event.clientY - startY

      if (!didPanHorizontally) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        if (Math.abs(dy) > Math.abs(dx)) {
          isDragging = false
          return
        }
        didPanHorizontally = true
        Keyboard.dismiss()
        activePagerEl.style.scrollSnapType = 'none'
        document.body.style.userSelect = 'none'
      }

      const maxScroll = Math.max(0, activePagerEl.scrollWidth - frameWidth)
      const nextLeft = Math.max(0, Math.min(maxScroll, startScrollLeft - dx))
      activePagerEl.scrollLeft = nextLeft
      syncFromScrollEl(activePagerEl)
    }

    const finishPointerDrag = (event: PointerEvent) => {
      if (!isDragging || event.pointerType === 'touch') return
      isDragging = false
      const pagerEl = activePagerEl
      activePagerEl = null
      document.body.style.userSelect = priorUserSelect
      if (pagerEl) {
        pagerEl.style.scrollSnapType = priorSnapType
      }

      if (!didPanHorizontally || !pagerEl) return
      lastDragEndTimeRef.current = Date.now()

      const dx = event.clientX - startX
      const elapsedMs = Math.max(16, Date.now() - startTime)
      const velocityX = dx / elapsedMs
      const startStep = activeStepRef.current

      let targetStep: AuthScreenStep =
        pagerEl.scrollLeft / frameWidth >= 0.5 ? 1 : 0
      if (dx < -frameWidth * 0.18 || velocityX < -0.3) {
        targetStep = 1
      } else if (dx > frameWidth * 0.18 || velocityX > 0.3) {
        targetStep = 0
      } else if (Math.abs(dx) <= 12) {
        targetStep = startStep
      }

      onRequestSnapToStep(targetStep)
    }

    const swallowSyntheticClickAfterDrag = (event: MouseEvent) => {
      if (Date.now() - lastDragEndTimeRef.current < 180) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    host.addEventListener('scroll', handleCaptureScroll, {
      capture: true,
      passive: true,
    })
    host.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', finishPointerDrag)
    window.addEventListener('pointercancel', finishPointerDrag)
    host.addEventListener('click', swallowSyntheticClickAfterDrag, true)

    return () => {
      host.style.userSelect = originalHostUserSelect
      document.body.style.userSelect = priorUserSelect
      if (activePagerEl) {
        activePagerEl.style.scrollSnapType = priorSnapType
      }
      host.removeEventListener('scroll', handleCaptureScroll, { capture: true })
      host.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', finishPointerDrag)
      window.removeEventListener('pointercancel', finishPointerDrag)
      host.removeEventListener('click', swallowSyntheticClickAfterDrag, true)
    }
  }, [
    enabled,
    frameWidth,
    scrollProgress,
    activeStepRef,
    onProgressSync,
    onRequestSnapToStep,
  ])

  return { hostRef }
}
