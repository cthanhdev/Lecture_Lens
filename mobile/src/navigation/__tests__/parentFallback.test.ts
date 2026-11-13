import { test } from 'node:test'
import assert from 'node:assert'
import { getParentFallback } from '../parentFallback.ts'

test('Định luật 1: Hierarchy Fallback Matrix cho các route con sâu trên Mobile', () => {
  // 1. Dynamic chapter drilldown phải về overview của bài giảng đó
  assert.strictEqual(
    getParentFallback('/lectures/macro-101/chapters/ch-3'),
    '/lectures/macro-101/cornell'
  )

  // 2. Dynamic lecture transcript/highlights/cornell phải fallback về /library
  assert.strictEqual(
    getParentFallback('/lectures/calculus-2/transcript'),
    '/library'
  )
  assert.strictEqual(
    getParentFallback('/lectures/calculus-2/highlights'),
    '/library'
  )
  assert.strictEqual(
    getParentFallback('/lectures/calculus-2/cornell'),
    '/library'
  )

  // 3. Dynamic course detail phải fallback về /subjects
  assert.strictEqual(
    getParentFallback('/subjects/macroeconomics'),
    '/subjects'
  )

  // 4. Settings phải fallback về /profile
  assert.strictEqual(
    getParentFallback('/settings'),
    '/profile'
  )

  // 5. Review session & complete phải fallback về /review
  assert.strictEqual(
    getParentFallback('/review/session/deck-123'),
    '/review'
  )
  assert.strictEqual(
    getParentFallback('/(guarded)/review/session/deck-123'),
    '/review'
  )
  assert.strictEqual(
    getParentFallback('/review/complete/deck-123'),
    '/review'
  )

  // 6. Search và Audio Record phải fallback về /home
  assert.strictEqual(getParentFallback('/search'), '/home')
  assert.strictEqual(getParentFallback('/(modal)/search'), '/home')
  assert.strictEqual(getParentFallback('/audio/record'), '/home')
  assert.strictEqual(getParentFallback('/(guarded)/audio/record'), '/home')

  // 7. Create Account -> Sign In; Sign In -> Onboarding (never loops unauthenticated users to /home)
  assert.strictEqual(getParentFallback('/auth/create-account'), '/auth/sign-in')
  assert.strictEqual(getParentFallback('/(auth)/create-account'), '/(auth)/sign-in')
  assert.strictEqual(getParentFallback('/create-account'), '/(auth)/sign-in')
  assert.strictEqual(getParentFallback('/sign-in'), '/(onboarding)/step-1')
  assert.strictEqual(getParentFallback('/(auth)/sign-in'), '/(onboarding)/step-1')

  // 8. Các tab chính phải fallback về /home
  assert.strictEqual(getParentFallback('/library'), '/home')
  assert.strictEqual(getParentFallback('/subjects'), '/home')
  assert.strictEqual(getParentFallback('/review'), '/home')
  assert.strictEqual(getParentFallback('/profile'), '/home')
  assert.strictEqual(getParentFallback('/(tabs)/library'), '/(tabs)/home')
})
