// [S24, S25] Flashcard - Active Recall Session (Guarded Session - Định luật 4)
import React, { useEffect } from 'react'
import { RouteSlot } from '@/components/navigation/RouteSlot'
import { useAppNavigation } from '@/navigation/NavigationContext'

export default function FlashcardSessionScreen() {
  const nav = useAppNavigation()

  useEffect(() => {
    // Đăng ký guard ngăn chặn thoát đột ngột làm mất tiến độ ôn tập
    const unregister = nav.registerGuard({
      id: 'active-flashcard-session',
      title: 'Tạm dừng phiên ôn tập?',
      message: 'Tiến độ ôn tập các thẻ hiện tại đã được ghi nhận. Bạn có chắc muốn quay về bàn học?',
      confirmText: 'Kết thúc ôn tập',
      cancelText: 'Học tiếp',
      guard: () => false,
    })
    return unregister
  }, [nav])

  return (
    <RouteSlot
      id="S24_25"
      number="24-25"
      name="Flashcard - Active Recall Session"
      category="Guarded Session (Định luật 4)"
      description="Phiên ôn tập thẻ nhớ Spaced Repetition (Mặt trước [24] & Mặt sau [25]). Đã kích hoạt Route Guard bảo vệ tiến độ học."
    />
  )
}
