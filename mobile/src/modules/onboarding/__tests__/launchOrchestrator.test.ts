import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { MemoryStorageAdapter } from '../../storage/MemoryStorageAdapter.ts'
import { MockAuthAdapter } from '../../auth/infrastructure/authSeam.ts'
import {
  ONBOARDING_SLIDES,
  ONBOARDING_STORAGE_KEY,
  clampOnboardingStep,
  clearOnboardingCompleted,
  completeOnboarding,
  hydrateLaunchRoute,
  isOnboardingCompleted,
  markOnboardingCompleted,
  resolveLaunchRoute,
} from '../launchOrchestrator.ts'

describe('Onboarding & Launch Orchestrator Seam', () => {
  it('resolveLaunchRoute luôn trả về Onboarding khi chưa có session và chỉ vào Home khi đã xác thực & hoàn tất', () => {
    assert.equal(
      resolveLaunchRoute({ onboardingCompleted: false, hasSession: false }),
      '/(onboarding)/step-1'
    )
    assert.equal(
      resolveLaunchRoute({ onboardingCompleted: true, hasSession: false }),
      '/(onboarding)/step-1'
    )
    assert.equal(
      resolveLaunchRoute({ onboardingCompleted: false, hasSession: true }),
      '/(onboarding)/step-1'
    )
    assert.equal(
      resolveLaunchRoute({ onboardingCompleted: true, hasSession: true }),
      '/(tabs)/home'
    )
  })

  it('đọc/ghi/xóa trạng thái hoàn tất onboarding qua KeyValueStorage seam', async () => {
    const storage = new MemoryStorageAdapter()

    assert.equal(await isOnboardingCompleted(storage), false)

    await markOnboardingCompleted(storage)
    assert.equal(await storage.getItem(ONBOARDING_STORAGE_KEY), 'true')
    assert.equal(await isOnboardingCompleted(storage), true)

    await clearOnboardingCompleted(storage)
    assert.equal(await storage.getItem(ONBOARDING_STORAGE_KEY), null)
    assert.equal(await isOnboardingCompleted(storage), false)
  })

  it('xử lý an toàn khi storage lỗi hoặc dữ liệu không hợp lệ', async () => {
    const corruptedStorage = new MemoryStorageAdapter()
    await corruptedStorage.setItem(ONBOARDING_STORAGE_KEY, 'invalid')
    assert.equal(await isOnboardingCompleted(corruptedStorage), false)

    const throwingStorage = {
      async getItem(): Promise<string | null> {
        throw new Error('Storage unavailable')
      },
      async setItem(): Promise<void> {
        throw new Error('Storage unavailable')
      },
      async removeItem(): Promise<void> {
        throw new Error('Storage unavailable')
      },
      async clear(): Promise<void> {},
    }

    assert.equal(await isOnboardingCompleted(throwingStorage), false)
    await assert.doesNotReject(() => clearOnboardingCompleted(throwingStorage))
  })

  it('hydrateLaunchRoute luôn mở lại trang 2, 3, 4 khi chưa đăng nhập (kể cả khi cờ cũ từng lưu true) và vào Home khi đã đăng nhập', async () => {
    const storage = new MemoryStorageAdapter()
    const authStorage = new MemoryStorageAdapter()
    const authSeam = new MockAuthAdapter(authStorage, 0)

    // 1. Lần đầu mở app (chưa có session)
    assert.equal(
      await hydrateLaunchRoute({ storage, authSeam }),
      '/(onboarding)/step-1'
    )

    // 2. Storage từng lưu cờ hoàn tất cũ nhưng chưa đăng nhập -> dọn sạch cờ và vẫn mở /(onboarding)/step-1
    await markOnboardingCompleted(storage)
    assert.equal(
      await hydrateLaunchRoute({ storage, authSeam }),
      '/(onboarding)/step-1'
    )
    assert.equal(await isOnboardingCompleted(storage), false)

    // 3. Đã đăng nhập -> đánh dấu hoàn tất và mở /(tabs)/home
    await authSeam.signIn({
      email: 'minh.tran@university.edu',
      password: 'KitsuneSecret99',
    })
    assert.equal(
      await hydrateLaunchRoute({ storage, authSeam }),
      '/(tabs)/home'
    )
    assert.equal(await isOnboardingCompleted(storage), true)

    // 4. Sau khi đăng xuất -> mở app lại quay về /(onboarding)/step-1
    await authSeam.signOut()
    assert.equal(
      await hydrateLaunchRoute({ storage, authSeam }),
      '/(onboarding)/step-1'
    )
    assert.equal(await isOnboardingCompleted(storage), false)
  })

  it('hydrateLaunchRoute fail-safe về Onboarding khi authSeam throw error', async () => {
    const storage = new MemoryStorageAdapter()
    await markOnboardingCompleted(storage)

    const failingAuth = {
      async getCurrentSession() {
        throw new Error('Network/storage failure')
      },
    }

    assert.equal(
      await hydrateLaunchRoute({ storage, authSeam: failingAuth }),
      '/(onboarding)/step-1'
    )
  })

  it('completeOnboarding chuyển tới Sign In khi chưa đăng nhập mà không khóa trang 2, 3, 4 ở lần mở app sau', async () => {
    const storage = new MemoryStorageAdapter()
    const authSeam = new MockAuthAdapter(new MemoryStorageAdapter(), 0)

    const nextUnauth = await completeOnboarding({ storage, authSeam })
    assert.equal(nextUnauth, '/(auth)/sign-in')
    assert.equal(await isOnboardingCompleted(storage), false)

    // Mở app lại khi vẫn chưa đăng nhập -> phải hiện lại trang 2, 3, 4
    assert.equal(
      await hydrateLaunchRoute({ storage, authSeam }),
      '/(onboarding)/step-1'
    )

    await authSeam.createAccount({
      fullName: 'Anh Nguyen',
      email: 'anh.nguyen@university.edu',
      password: 'Password123',
      agreeTerms: true,
    })
    const nextAuth = await completeOnboarding({ storage, authSeam })
    assert.equal(nextAuth, '/(tabs)/home')
    assert.equal(await isOnboardingCompleted(storage), true)
  })

  it('ONBOARDING_SLIDES dùng 100% Tiếng Anh đúng mẫu 02-04, không chứa nút Skip và clamp bước an toàn', () => {
    assert.equal(ONBOARDING_SLIDES.length, 3)

    assert.equal(
      ONBOARDING_SLIDES[0].title,
      'Turn every lecture into something you can search.'
    )
    assert.equal(ONBOARDING_SLIDES[0].ctaLabel, 'Continue')
    assert.equal(
      ONBOARDING_SLIDES[1].title,
      'Highlights and summaries, done for you.'
    )
    assert.equal(ONBOARDING_SLIDES[1].ctaLabel, 'Continue')
    assert.equal(
      ONBOARDING_SLIDES[2].title,
      'Flashcards that play the original lecture.'
    )
    assert.equal(ONBOARDING_SLIDES[2].ctaLabel, 'Get started')

    // Đảm bảo không có nút/nhãn Skip hoặc top headerPill nào trong metadata onboarding
    const serialized = JSON.stringify(ONBOARDING_SLIDES).toLowerCase()
    assert.equal(serialized.includes('"skip"'), false)
    for (const slide of ONBOARDING_SLIDES) {
      assert.equal('headerPill' in slide, false)
    }

    assert.equal(clampOnboardingStep(-2), 0)
    assert.equal(clampOnboardingStep(0), 0)
    assert.equal(clampOnboardingStep(1), 1)
    assert.equal(clampOnboardingStep(2), 2)
    assert.equal(clampOnboardingStep(99), 2)
  })
})
