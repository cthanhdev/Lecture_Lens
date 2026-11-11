// [S14] Audio - Live Recording (Guarded Screen - Định luật 4)
import React, { useEffect } from 'react'
import { RouteSlot } from '@/components/navigation/RouteSlot'
import { useAppNavigation } from '@/navigation/NavigationContext'

export default function LiveRecordingScreen() {
  const nav = useAppNavigation()

  useEffect(() => {
    // Đăng ký guard ngăn chặn vô tình thoát khi đang ghi âm (Định luật 4)
    const unregister = nav.registerGuard({
      id: 'active-recording',
      title: 'Đang ghi âm bài giảng!',
      message: 'Nếu rời khỏi trang bây giờ, tiến trình ghi âm trực tiếp sẽ bị dừng và dữ liệu chưa phân tích sẽ bị hủy.',
      confirmText: 'Hủy bản ghi & Thoát',
      cancelText: 'Tiếp tục ghi âm',
      guard: () => false,
    })
    return unregister
  }, [nav])

  return (
    <RouteSlot
      id="S14"
      number="14"
      name="Audio - Live Recording"
      category="Guarded Screen (Định luật 4)"
      description="Màn hình ghi âm bài giảng thời gian thực. Đã kích hoạt Route Guard: Thử bấm phím Quay lại hoặc chuyển trang để kiểm tra hộp thoại Mochi cảnh báo."
    />
  )
}
